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
