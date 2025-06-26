#ifndef BACKTRACKING_STRATEGY_H
#define BACKTRACKING_STRATEGY_H

#include "partition_encryption.h"
#include <unordered_map>
#include <string>
#include <vector>
#include <gmpxx.h>
#include <set>

/**
 * @class BacktrackingStrategy
 * @brief Implementation of the Backtracking with Pruning decryption strategy
 * 
 * This strategy uses depth-first search with aggressive constraint-based pruning:
 * - Builds passwords character by character
 * - Prunes branches early when partial sums exceed target or are impossible
 * - Uses bounds checking to eliminate impossible paths
 * - Memory efficient compared to MITM but potentially slower for longer passwords
 */
class BacktrackingStrategy : public DecryptionStrategy {
public:
    /**
     * @brief Constructor
     * @param enableOptimizations Whether to enable advanced pruning optimizations
     * @param maxSolutions Maximum number of solutions to find (0 = unlimited)
     */
    BacktrackingStrategy(bool enableOptimizations = true, size_t maxSolutions = 0);

    /**
     * @brief Decrypt using Backtracking with Pruning approach
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
    std::string getName() const override { return "Backtracking with Pruning"; }

    /**
     * @brief Set the maximum number of solutions to find
     * @param maxSols Maximum solutions (0 = unlimited)
     */
    void setMaxSolutions(size_t maxSols) { maxSolutions = maxSols; }

    /**
     * @brief Enable or disable optimization features
     * @param enable Whether to enable optimizations
     */
    void setOptimizations(bool enable) { enableOptimizations = enable; }

private:
    /**
     * @brief Recursive backtracking function
     * @param currentPassword Current partial password being built
     * @param currentSum Current sum of partition values
     * @param targetSum Target sum to reach
     * @param remainingSum Maximum possible sum from remaining positions
     * @param minLength Minimum password length
     * @param maxLength Maximum password length
     * @param charToPartition Character to partition mapping
     * @param sortedChars Sorted characters for optimization
     * @param results Vector to store found solutions
     * @return True if should continue searching, false if max solutions reached
     */
    bool backtrackRecursive(
        const std::string& currentPassword,
        const mpz_class& currentSum,
        const mpz_class& targetSum,
        const mpz_class& remainingSum,
        unsigned int minLength,
        unsigned int maxLength,
        const std::unordered_map<char, mpz_class>& charToPartition,
        const std::vector<std::pair<char, mpz_class>>& sortedChars,
        std::vector<std::string>& results);

    /**
     * @brief Calculate bounds for pruning
     * @param charToPartition Character to partition mapping
     * @param minVal Minimum partition value
     * @param maxVal Maximum partition value
     */
    void calculateBounds(
        const std::unordered_map<char, mpz_class>& charToPartition,
        mpz_class& minVal,
        mpz_class& maxVal);

    /**
     * @brief Check if current path can lead to a valid solution
     * @param currentSum Current partial sum
     * @param targetSum Target sum
     * @param remainingPositions Remaining positions to fill
     * @param minVal Minimum partition value
     * @param maxVal Maximum partition value
     * @param currentLength Current password length
     * @param minLength Minimum required length
     * @param maxLength Maximum allowed length
     * @return True if path is viable, false if should be pruned
     */
    bool isViablePath(
        const mpz_class& currentSum,
        const mpz_class& targetSum,
        unsigned int remainingPositions,
        const mpz_class& minVal,
        const mpz_class& maxVal,
        unsigned int currentLength,
        unsigned int minLength,
        unsigned int maxLength);

    /**
     * @brief Create a sorted list of characters by partition value
     * @param charToPartition Character to partition mapping
     * @return Sorted vector of (character, partition_value) pairs
     */
    std::vector<std::pair<char, mpz_class>> createSortedCharacters(
        const std::unordered_map<char, mpz_class>& charToPartition);

    /**
     * @brief Calculate remaining sum potential from current position
     * @param targetSum Target sum to reach
     * @param currentSum Current partial sum
     * @param remainingPositions Remaining positions
     * @param maxVal Maximum partition value
     * @return Maximum possible remaining sum
     */
    mpz_class calculateRemainingSum(
        const mpz_class& targetSum,
        const mpz_class& currentSum,
        unsigned int remainingPositions,
        const mpz_class& maxVal);

    bool enableOptimizations;     // Whether to use advanced pruning
    size_t maxSolutions;          // Maximum solutions to find (0 = unlimited)
    mpz_class minPartitionVal;    // Cached minimum partition value
    mpz_class maxPartitionVal;    // Cached maximum partition value
    size_t pruneCount;            // Count of pruned branches for statistics
};

#endif // BACKTRACKING_STRATEGY_H