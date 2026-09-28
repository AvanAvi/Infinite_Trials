#ifndef MITM_STRATEGY_H
#define MITM_STRATEGY_H

#include "partition_encryption.h"
#include <unordered_map>
#include <string>
#include <vector>
#include <gmpxx.h>

// mpz_class (GMP's __gmp_expr) has no std::hash specialization, so it can't
// be an unordered_map key on its own; hash it via its decimal string form.
struct MpzHash {
    std::size_t operator()(const mpz_class& v) const noexcept {
        return std::hash<std::string>()(v.get_str());
    }
};

/**
 * @class MeetInTheMiddleStrategy
 * @brief Meet-in-the-Middle decryption strategy over character *multisets*.
 *
 * Splits a candidate password length into two halves, enumerates every
 * character multiset for each half (non-decreasing partition-value order,
 * so each multiset is generated exactly once) bucketed by its sum, then
 * merges matching (sum1, sum2) pairs where sum1 + sum2 == target. Each
 * half's generation is pruned against the range the other half would need
 * to complete a match, so sums that could never combine into the target
 * are never materialized.
 *
 * Different (sum1, sum2) splits of the same final multiset can rediscover
 * the same merged string (e.g. splitting "aab" as "a"+"ab" and as "b"+"aa"
 * both merge back to "aab"), so results are deduplicated before returning.
 */
class MeetInTheMiddleStrategy : public DecryptionStrategy {
public:
    /**
     * @brief Constructor
     * @param maxMemoryGB Maximum memory usage in GB (approximate, informational)
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
     * @brief Create a list of characters sorted ascending by partition value
     */
    std::vector<std::pair<char, mpz_class>> createSortedCharacters(
        const std::unordered_map<char, mpz_class>& charToPartition);

    /**
     * @brief Enumerate every multiset of exactly `length` characters whose
     *        sum falls in [lowBound, highBound], bucketed by sum.
     */
    std::unordered_map<mpz_class, std::vector<std::string>, MpzHash> generatePartialSums(
        const std::vector<std::pair<char, mpz_class>>& sortedChars,
        unsigned int length,
        const mpz_class& minVal,
        const mpz_class& maxVal,
        const mpz_class& lowBound,
        const mpz_class& highBound);

    /**
     * @brief Recursive helper for generatePartialSums
     * @return False once maxEntries has been reached (stop searching), true to keep going
     */
    bool generatePartialSumsRecursive(
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
        std::unordered_map<mpz_class, std::vector<std::string>, MpzHash>& results);

    /**
     * @brief Find matching (sum1, sum2) pairs summing to targetSum and merge
     *        each pair's partial passwords into a full canonical multiset
     */
    std::vector<std::string> findMatches(
        const std::unordered_map<mpz_class, std::vector<std::string>, MpzHash>& firstHalfSums,
        const std::unordered_map<mpz_class, std::vector<std::string>, MpzHash>& secondHalfSums,
        const mpz_class& targetSum,
        const std::unordered_map<char, mpz_class>& charToPartition);

    /**
     * @brief Merge two canonically-sorted partial passwords into one, keeping
     *        the result in non-decreasing partition-value order
     */
    std::string mergeSorted(
        const std::string& a,
        const std::string& b,
        const std::unordered_map<char, mpz_class>& charToPartition);

    double maxMemoryGB; // Caps how many partial sums a half may accumulate before giving up
};

#endif // MITM_STRATEGY_H
