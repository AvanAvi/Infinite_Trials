#ifndef INVERSE_PARTITION_H
#define INVERSE_PARTITION_H

#include <gmpxx.h>
#include <optional>
#include <string>
#include <vector>

/**
 * @brief Compute p(0..n) via Euler's pentagonal number recurrence.
 * @param n Highest index to compute (inclusive)
 * @return Vector of size n+1 where the result[i] == p(i)
 */
std::vector<mpz_class> computePartitionTable(unsigned long n);

/**
 * @brief Given p(n) as a decimal string, find n such that partition(n) == p(n).
 *
 * Estimates n via the Hardy-Ramanujan asymptotic inversion
 * n ~ (3/2)(ln p / pi)^2, then computes exact partition values via
 * computePartitionTable() around that estimate to confirm it (growing the
 * search window if the estimate undershoots, which the asymptotic formula
 * does for small n).
 *
 * p(0) == p(1) == 1, so a target of "1" is ambiguous; the smallest matching
 * n (0) is returned in that case.
 *
 * @param partitionValueDecimal p(n) as a non-negative decimal integer string
 * @return n if partitionValueDecimal is a valid partition number, std::nullopt otherwise
 * @throws std::invalid_argument if the input is not a valid non-negative decimal integer
 */
std::optional<unsigned long> invertPartition(const std::string& partitionValueDecimal);

#endif // INVERSE_PARTITION_H
