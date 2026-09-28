#include "backtracking_strategy.h"
#include <algorithm>
#include <chrono>

BacktrackingStrategy::BacktrackingStrategy(bool enableOptimizations, size_t maxSolutions)
    : enableOptimizations(enableOptimizations), maxSolutions(maxSolutions), pruneCount(0) {
}

std::vector<std::string> BacktrackingStrategy::decrypt(
    const mpz_class& targetSum,
    const std::unordered_map<char, mpz_class>& charToPartition,
    unsigned int minLength,
    unsigned int maxLength) {

    auto startTime = std::chrono::high_resolution_clock::now();
    std::vector<std::string> results;
    combinationsChecked = 0;
    pruneCount = 0;

    if (charToPartition.empty()) {
        return results;
    }

    // Calculate bounds for pruning
    calculateBounds(charToPartition, minPartitionVal, maxPartitionVal);

    // Ascending order lets overshoot pruning skip every remaining (larger) candidate.
    auto sortedChars = createSortedCharacters(charToPartition);

    // Try each possible password length
    for (unsigned int length = minLength; length <= maxLength; ++length) {
        mpz_class maxPossibleSum = maxPartitionVal * length;
        mpz_class minPossibleSum = minPartitionVal * length;

        // Early pruning: check if target is achievable with this length
        if (targetSum > maxPossibleSum || targetSum < minPossibleSum) {
            continue;
        }

        std::string currentPassword;
        currentPassword.reserve(length);

        if (!backtrackRecursive(currentPassword, 0, targetSum, length, 0, sortedChars, results)) {
            break; // Max solutions reached
        }
    }

    auto endTime = std::chrono::high_resolution_clock::now();
    duration = std::chrono::duration_cast<std::chrono::microseconds>(endTime - startTime);

    // Estimate memory usage (rough approximation)
    memoryUsed = results.size() * 50 + sortedChars.size() * 20; // bytes

    return results;
}

bool BacktrackingStrategy::backtrackRecursive(
    std::string& currentPassword,
    const mpz_class& currentSum,
    const mpz_class& targetSum,
    unsigned int length,
    size_t startIdx,
    const std::vector<std::pair<char, mpz_class>>& sortedChars,
    std::vector<std::string>& results) {

    ++combinationsChecked;

    // Base case: we've built a password of the requested length
    if (currentPassword.length() == length) {
        if (currentSum == targetSum) {
            results.push_back(currentPassword);

            // Check if we've reached max solutions
            if (maxSolutions > 0 && results.size() >= maxSolutions) {
                return false;
            }
        }
        return true;
    }

    // Pruning: check if current path is viable
    unsigned int remainingPositions = length - static_cast<unsigned int>(currentPassword.length());
    if (enableOptimizations && !isViablePath(currentSum, targetSum, remainingPositions,
                                              minPartitionVal, maxPartitionVal)) {
        ++pruneCount;
        return true;
    }

    // Only consider characters from startIdx onward (and re-offer the same index)
    // so each multiset is enumerated exactly once, in non-decreasing order.
    for (size_t idx = startIdx; idx < sortedChars.size(); ++idx) {
        const auto& [character, partitionValue] = sortedChars[idx];
        mpz_class newSum = currentSum + partitionValue;

        // Early pruning: characters are sorted ascending, so once one overshoots,
        // every later (larger-valued) character overshoots too.
        if (newSum > targetSum) {
            break;
        }

        // Advanced pruning: check if remaining positions can reach target
        if (enableOptimizations) {
            unsigned int remainingAfterThis = remainingPositions - 1;
            mpz_class sumNeeded = targetSum - newSum;
            mpz_class maxRemaining = maxPartitionVal * remainingAfterThis;
            mpz_class minRemaining = minPartitionVal * remainingAfterThis;

            if (sumNeeded > maxRemaining || sumNeeded < minRemaining) {
                ++pruneCount;
                continue;
            }
        }

        currentPassword.push_back(character);
        bool shouldContinue = backtrackRecursive(currentPassword, newSum, targetSum, length,
                                                  idx, sortedChars, results);
        currentPassword.pop_back();

        if (!shouldContinue) {
            return false; // Max solutions reached
        }
    }

    return true;
}

void BacktrackingStrategy::calculateBounds(
    const std::unordered_map<char, mpz_class>& charToPartition,
    mpz_class& minVal,
    mpz_class& maxVal) {

    if (charToPartition.empty()) {
        minVal = 0;
        maxVal = 0;
        return;
    }

    auto it = charToPartition.begin();
    minVal = maxVal = it->second;

    for (const auto& [character, partitionValue] : charToPartition) {
        if (partitionValue < minVal) {
            minVal = partitionValue;
        }
        if (partitionValue > maxVal) {
            maxVal = partitionValue;
        }
    }
}

bool BacktrackingStrategy::isViablePath(
    const mpz_class& currentSum,
    const mpz_class& targetSum,
    unsigned int remainingPositions,
    const mpz_class& minVal,
    const mpz_class& maxVal) {

    if (remainingPositions == 0) {
        return currentSum == targetSum;
    }

    // Check bounds
    mpz_class sumNeeded = targetSum - currentSum;
    mpz_class maxPossible = maxVal * remainingPositions;
    mpz_class minPossible = minVal * remainingPositions;

    return (sumNeeded <= maxPossible && sumNeeded >= minPossible);
}

std::vector<std::pair<char, mpz_class>> BacktrackingStrategy::createSortedCharacters(
    const std::unordered_map<char, mpz_class>& charToPartition) {

    std::vector<std::pair<char, mpz_class>> sortedChars;
    sortedChars.reserve(charToPartition.size());

    for (const auto& [character, partitionValue] : charToPartition) {
        sortedChars.emplace_back(character, partitionValue);
    }

    // Sort by partition value ascending: overshoot pruning (break) is only
    // sound in this direction, and it fixes the canonical multiset order.
    std::sort(sortedChars.begin(), sortedChars.end(),
              [](const auto& a, const auto& b) {
                  return a.second < b.second;
              });

    return sortedChars;
}
