#ifndef MITM_STRATEGY_H
#define MITM_STRATEGY_H

#include "partition_encryption.h"
#include <unordered_map>
#include <string>
#include <vector>
#include <gmpxx.h>

/**
 * @class MeetInTheMiddleStrategy
 * @brief Implementation of the Meet-in-the-Middle decryption strategy
 * 
 * This strategy reduces complexity from O(c^n) to O(c^(n/2)) by splitting the problem in half:
    - Generate all possible sums for the first half of positions
    - Generate all possible sums for the second half of positions
    - Find matching pairs that sum to the target value
 */
class MeetInTheMiddleStrategy : public DecryptionStrategy {
public:
    /**
     * @brief Constructor
     * @param maxMemoryGB Maximum memory usage in GB (approximate)
     */
    MeetInTheMiddleStrategy(double maxMemoryGB = 4.0);

    /**
     * @brief Decrypt using Meet-in-the-Middle approach
     * @param targetSum The K value (Z - C) to find partitioning for
     * @param charToPartition Map of characters to their partition values
     * @param minLength Minimum allowed password length
     * @param maxLength Maximum allowed password length
     * @return Possible decryption results (may be multiple or none)
     */
    std::vector<std::string> decrypt(
        const mpz_class& targetSum,
        const std::unordered_map<char, mpz_class>& charToPartition,
        unsigned int minLength,
        unsigned int maxLength) override;

    /**
     * @brief Get the strategy name
     * @return Strategy name
     */
    std::string getName() const override { return "Meet-in-the-Middle"; }

private:
    /**
     * @brief Generate all possible partition sums for a subset of positions
     * @param charToPartition Map of characters to their partition values
     * @param length Length of password to consider
     * @param isFirstHalf Whether this is the first or second half
     * @return Map of sums to corresponding partial passwords
     */
    std::unordered_map<mpz_class, std::vector<std::string>> generatePartialSums(
        const std::unordered_map<char, mpz_class>& charToPartition,
        unsigned int length,
        bool isFirstHalf);

    /**
     * @brief Recursive helper for generating partial sums
     * @param charToPartition Map of characters to their partition values
     * @param currentSum Current partial sum
     * @param currentPassword Current partial password
     * @param depth Current recursion depth
     * @param maxDepth Maximum recursion depth
     * @param results Map to store results
     */
    void generatePartialSumsRecursive(
        const std::unordered_map<char, mpz_class>& charToPartition,
        const mpz_class& currentSum,
        const std::string& currentPassword,
        unsigned int depth,
        unsigned int maxDepth,
        std::unordered_map<mpz_class, std::vector<std::string>>& results);

    /**
     * @brief Find matching pairs between first and second half
     * @param firstHalfSums Sums from first half
     * @param secondHalfSums Sums from second half
     * @param targetSum Total target sum
     * @return Vector of complete passwords
     */
    std::vector<std::string> findMatches(
        const std::unordered_map<mpz_class, std::vector<std::string>>& firstHalfSums,
        const std::unordered_map<mpz_class, std::vector<std::string>>& secondHalfSums,
        const mpz_class& targetSum);

    double maxMemoryGB; // Maximum memory usage limit in GB
};

#endif // MITM_STRATEGY_H
