#include "mitm_strategy.h"
#include <algorithm>
#include <chrono>

MeetInTheMiddleStrategy::MeetInTheMiddleStrategy(double maxMemoryGB)
    : maxMemoryGB(maxMemoryGB) {
}

std::vector<std::pair<char, mpz_class>> MeetInTheMiddleStrategy::createSortedCharacters(
    const std::unordered_map<char, mpz_class>& charToPartition) {

    std::vector<std::pair<char, mpz_class>> sortedChars;
    sortedChars.reserve(charToPartition.size());

    for (const auto& [character, partitionValue] : charToPartition) {
        sortedChars.emplace_back(character, partitionValue);
    }

    std::sort(sortedChars.begin(), sortedChars.end(),
              [](const auto& a, const auto& b) {
                  return a.second < b.second;
              });

    return sortedChars;
}

bool MeetInTheMiddleStrategy::generatePartialSumsRecursive(
    std::string& currentPassword,
    const mpz_class& currentSum,
    unsigned int length,
    size_t startIdx,
    const std::vector<std::pair<char, mpz_class>>& sortedChars,
    const mpz_class& minVal,
    const mpz_class& maxVal,
    const mpz_class& lowBound,
    const mpz_class& highBound,
    size_t maxEntries,
    std::unordered_map<mpz_class, std::vector<std::string>, MpzHash>& results) {

    unsigned int remaining = length - static_cast<unsigned int>(currentPassword.length());

    if (remaining == 0) {
        if (currentSum >= lowBound && currentSum <= highBound) {
            results[currentSum].push_back(currentPassword);
        }
        return results.size() < maxEntries;
    }

    // Prune subtrees that can never land in the range the other half needs.
    mpz_class achievableMin = currentSum + minVal * remaining;
    mpz_class achievableMax = currentSum + maxVal * remaining;
    if (achievableMax < lowBound || achievableMin > highBound) {
        return true;
    }

    for (size_t idx = startIdx; idx < sortedChars.size(); ++idx) {
        mpz_class newSum = currentSum + sortedChars[idx].second;

        // Ascending order: once a candidate exceeds highBound, every later
        // (larger-valued) candidate does too.
        if (newSum > highBound) {
            break;
        }

        currentPassword.push_back(sortedChars[idx].first);
        bool shouldContinue = generatePartialSumsRecursive(
            currentPassword, newSum, length, idx, sortedChars, minVal, maxVal,
            lowBound, highBound, maxEntries, results);
        currentPassword.pop_back();

        if (!shouldContinue) {
            return false; // maxEntries reached, stop generating for this half
        }
    }

    return true;
}

std::unordered_map<mpz_class, std::vector<std::string>, MpzHash> MeetInTheMiddleStrategy::generatePartialSums(
    const std::vector<std::pair<char, mpz_class>>& sortedChars,
    unsigned int length,
    const mpz_class& minVal,
    const mpz_class& maxVal,
    const mpz_class& lowBound,
    const mpz_class& highBound) {

    std::unordered_map<mpz_class, std::vector<std::string>, MpzHash> results;
    std::string buffer;
    buffer.reserve(length);

    // Rough per-entry memory estimate (bytes): stored string plus map/vector overhead.
    const size_t estimatedBytesPerEntry = static_cast<size_t>(length) + 64;
    size_t maxEntries = static_cast<size_t>(maxMemoryGB * 1e9 / estimatedBytesPerEntry);
    if (maxEntries == 0) {
        maxEntries = 1;
    }

    generatePartialSumsRecursive(buffer, 0, length, 0, sortedChars, minVal, maxVal,
                                  lowBound, highBound, maxEntries, results);

    return results;
}

std::string MeetInTheMiddleStrategy::mergeSorted(
    const std::string& a,
    const std::string& b,
    const std::unordered_map<char, mpz_class>& charToPartition) {

    std::string result;
    result.reserve(a.size() + b.size());
    size_t i = 0, j = 0;

    while (i < a.size() && j < b.size()) {
        if (charToPartition.at(a[i]) <= charToPartition.at(b[j])) {
            result.push_back(a[i++]);
        } else {
            result.push_back(b[j++]);
        }
    }
    result.append(a, i, std::string::npos);
    result.append(b, j, std::string::npos);

    return result;
}

std::vector<std::string> MeetInTheMiddleStrategy::findMatches(
    const std::unordered_map<mpz_class, std::vector<std::string>, MpzHash>& firstHalfSums,
    const std::unordered_map<mpz_class, std::vector<std::string>, MpzHash>& secondHalfSums,
    const mpz_class& targetSum,
    const std::unordered_map<char, mpz_class>& charToPartition) {

    std::vector<std::string> matches;

    for (const auto& [sum1, passwords1] : firstHalfSums) {
        mpz_class needed = targetSum - sum1;
        auto it = secondHalfSums.find(needed);
        if (it == secondHalfSums.end()) {
            continue;
        }
        for (const auto& p1 : passwords1) {
            for (const auto& p2 : it->second) {
                matches.push_back(mergeSorted(p1, p2, charToPartition));
            }
        }
    }

    return matches;
}

std::vector<std::string> MeetInTheMiddleStrategy::decrypt(
    const mpz_class& targetSum,
    const std::unordered_map<char, mpz_class>& charToPartition,
    unsigned int minLength,
    unsigned int maxLength) {

    auto startTime = std::chrono::high_resolution_clock::now();
    std::vector<std::string> allResults;
    combinationsChecked = 0;

    if (!charToPartition.empty()) {
        auto sortedChars = createSortedCharacters(charToPartition);
        const mpz_class& minVal = sortedChars.front().second;
        const mpz_class& maxVal = sortedChars.back().second;

        for (unsigned int length = minLength; length <= maxLength; ++length) {
            mpz_class maxPossibleSum = maxVal * length;
            mpz_class minPossibleSum = minVal * length;
            if (targetSum > maxPossibleSum || targetSum < minPossibleSum) {
                continue;
            }

            unsigned int firstHalfLen = length / 2;
            unsigned int secondHalfLen = length - firstHalfLen;

            mpz_class firstMin = minVal * firstHalfLen;
            mpz_class firstMax = maxVal * firstHalfLen;
            mpz_class secondMin = minVal * secondHalfLen;
            mpz_class secondMax = maxVal * secondHalfLen;

            // Each half only needs sums the other half could actually complete.
            mpz_class firstLow = targetSum - secondMax;
            mpz_class firstHigh = targetSum - secondMin;
            mpz_class secondLow = targetSum - firstMax;
            mpz_class secondHigh = targetSum - firstMin;

            auto firstHalfSums = generatePartialSums(sortedChars, firstHalfLen, minVal, maxVal,
                                                       firstLow, firstHigh);
            auto secondHalfSums = generatePartialSums(sortedChars, secondHalfLen, minVal, maxVal,
                                                        secondLow, secondHigh);

            combinationsChecked += firstHalfSums.size() + secondHalfSums.size();

            auto matches = findMatches(firstHalfSums, secondHalfSums, targetSum, charToPartition);
            allResults.insert(allResults.end(), matches.begin(), matches.end());
        }
    }

    // The same final multiset can be rediscovered through more than one
    // (sum1, sum2) split (e.g. "aab" via "a"+"ab" and via "b"+"aa").
    std::sort(allResults.begin(), allResults.end());
    allResults.erase(std::unique(allResults.begin(), allResults.end()), allResults.end());

    auto endTime = std::chrono::high_resolution_clock::now();
    duration = std::chrono::duration_cast<std::chrono::microseconds>(endTime - startTime);
    memoryUsed = allResults.size() * 50;

    return allResults;
}
