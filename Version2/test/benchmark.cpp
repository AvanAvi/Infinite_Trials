#include <iostream>
#include <memory>
#include <vector>

#include "partition_encryption.h"
#include "backtracking_strategy.h"

// Standalone timing utility, not a correctness test (see test_partition_encryption.cpp
// and Step 3 for correctness coverage of the decryption strategies).
int main() {
    PartitionEncryption system(LOOKUP_TABLE_PATH);

    const std::vector<std::string> samples = {"a", "ab", "abc", "abcd"};

    for (const auto& password : samples) {
        mpz_class z = system.encrypt(password);

        auto strategy = std::make_shared<BacktrackingStrategy>(/*enableOptimizations=*/true,
                                                                 /*maxSolutions=*/50);
        std::cout << "\n=== Decrypting password of length " << password.length()
                  << " ===" << std::endl;
        system.decrypt(z, strategy);
    }

    return 0;
}
