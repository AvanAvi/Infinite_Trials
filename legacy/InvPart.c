/**
 * LEGACY - kept for history only. Do not build or use.
 *
 * Despite its name, this does NOT invert the partition function p(n).
 * `numDigits` is set from strlen(partitionNum) - the number of *digits the
 * user typed*, not the value itself. So entering "190569292" (which is
 * p(100)) sets numDigits = 9, and the DP below then computes p(9) = 30,
 * a completely unrelated number. It has never inverted anything.
 *
 * The DP itself is also broken independent of the above: for a fixed i,
 * `dp[j] += dp[j - i]` has a loop-carried dependency whenever j - i >= i,
 * since that slot is written earlier in the very same parallel loop
 * (this is what makes the unbounded-coin-change recurrence correct when
 * run serially in ascending j order). `#pragma omp parallel for` on this
 * inner loop is a data race: threads read dp[j-i] before or after it's
 * updated non-deterministically, so results vary between runs and are
 * wrong regardless.
 *
 * A correct inverse-partition tool lives at Version2/include/inverse_partition.h
 * and Version2/src/inverse_partition.cpp: given p(n) as a decimal string, it
 * estimates n via the Hardy-Ramanujan inversion and confirms it exactly via
 * Euler's pentagonal number recurrence, with no parallelism and no race.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <omp.h>


// (I never thought that i'll use this bogus Parallel programming lib omp ever again after my parallel programming course but then...)
#define MAX_DIGITS 100

void calculateInversePartition(char* partitionNum, int numDigits, char* result) {
    // Initialize the dynamic programming table
    unsigned long long dp[MAX_DIGITS + 1];
    memset(dp, 0, sizeof(dp));
    dp[0] = 1;

    // Compute the inverse of partitions
    for (int i = 1; i <= numDigits; i++) {
        #pragma omp parallel for
        for (int j = i; j <= numDigits; j++) {
            dp[j] += dp[j - i];
        }
    }

    // Convert the result to a string
    sprintf(result, "%llu", dp[numDigits]);
}

int main() {
    char partitionNum[MAX_DIGITS];
    printf("Enter the partition number: ");
    scanf("%s", partitionNum);

	// Just to let you know I (Avan aka ZeusVoltaire Ranted here cuz bloody fuck it is such a compute heavy task and my system started making irritating noises with its fan )

    int numDigits = strlen(partitionNum);
    char inversePartition[MAX_DIGITS];
    calculateInversePartition(partitionNum, numDigits, inversePartition);

    printf("The inverse of partitions for %s is %s\n", partitionNum, inversePartition);

    return 0;
}
