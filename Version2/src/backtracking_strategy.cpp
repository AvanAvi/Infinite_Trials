#include "backtracking_strategy.h"
#include <algorithm>
#include <chrono>
#include <iostream>
#include <climits>

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
    
    // Create sorted character list for optimization
    auto sortedChars = createSortedCharacters(charToPartition);
    
    // Try each possible password length
    for (unsigned int length = minLength; length <= maxLength; ++length) {
        mpz_class maxPossibleSum = maxPartitionVal * length;
        mpz_class minPossibleSum = minPartitionVal * length;
        
        // Early pruning: check if target is achievable with this length
        if (targetSum > maxPossibleSum || targetSum < minPossibleSum) {
            continue;
        }
        
        // Calculate remaining sum potential
        mpz_class remainingSum = calculateRemainingSum(targetSum, 0, length, maxPartitionVal);
        
        // Start backtracking
        if (!backtrackRecursive("", 0, targetSum, remainingSum, length, length, 
                                charToPartition, sortedChars, results)) {
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
    const std::string& currentPassword,
    const mpz_class& currentSum,
    const mpz_class& targetSum,
    const mpz_class& remainingSum,
    unsigned int minLength,
    unsigned int maxLength,
    const std::unordered_map<char, mpz_class>& charToPartition,
    const std::vector<std::pair<char, mpz_class>>& sortedChars,
    std::vector<std::string>& results) {
    
    ++combinationsChecked;
    
    // Base case: we've reached the desired length
    if (currentPassword.length() == minLength) {
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
    unsigned int remainingPositions = minLength - currentPassword.length();
    if (enableOptimizations && !isViablePath(currentSum, targetSum, remainingPositions,
                                           minPartitionVal, maxPartitionVal,
                                           currentPassword.length(), minLength, maxLength)) {
        ++pruneCount;
        return true;
    }
    
    // Try each character
    for (const auto& [character, partitionValue] : sortedChars) {
        mpz_class newSum = currentSum + partitionValue;
        
        // Early pruning: if adding this character makes sum too large
        if (newSum > targetSum) {
            // Since characters are sorted by partition value (descending),
            // all remaining characters will also make the sum too large
            if (enableOptimizations) {
                break;
            }
            continue;
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
        
        // Recursive call
        mpz_class newRemainingSum = calculateRemainingSum(targetSum, newSum, 
                                                         remainingPositions - 1, maxPartitionVal);
        
        if (!backtrackRecursive(currentPassword + character, newSum, targetSum,
                               newRemainingSum, minLength, maxLength, charToPartition,
                               sortedChars, results)) {
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
    const mpz_class& maxVal,
    unsigned int currentLength,
    unsigned int minLength,
    unsigned int maxLength) {
    
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
    
    // Sort by partition value in descending order for better pruning
    std::sort(sortedChars.begin(), sortedChars.end(),
              [](const auto& a, const auto& b) {
                  return a.second > b.second;
              });
    
    return sortedChars;
}

mpz_class BacktrackingStrategy::calculateRemainingSum(
    const mpz_class& targetSum,
    const mpz_class& currentSum,
    unsigned int remainingPositions,
    const mpz_class& maxVal) {
    
    if (remainingPositions == 0) {
        return 0;
    }
    
    mpz_class sumNeeded = targetSum - currentSum;
    mpz_class maxPossible = maxVal * remainingPositions;
    
    return (sumNeeded < maxPossible) ? sumNeeded : maxPossible;
}

std::string DecryptionStrategy::getPerformanceMetrics() const {
    double durationMs = duration.count() / 1000.0;
    double memoryKB = memoryUsed / 1024.0;
    
    std::string metrics = "Performance Metrics:\n";
    metrics += "  Duration: " + std::to_string(durationMs) + " ms\n";
    metrics += "  Combinations checked: " + std::to_string(combinationsChecked) + "\n";
    metrics += "  Memory used: " + std::to_string(memoryKB) + " KB\n";
    
    return metrics;
}