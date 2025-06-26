/**
@Note : Extensive comments are provided for the reader's benefit.
        
        - 

*/

#ifndef PARTITION_ENCRYPTION_H
#define PARTITION_ENCRYPTION_H

#include <string>
#include <unordered_map>
#include <vector>
#include <chrono>
#include <iostream>
#include <memory>
#include <gmpxx.h> // For GMP library

/**
 * @class PartitionEncryption
 * @brief Main class for handling partition-based encryption and decryption
 */
class PartitionEncryption {
  public:
  /**
    @brief Constructor for encryption system
    @param lookuptablePath to the lookup table file
  */
    PartitionEncryption(const std::string& lookuptablePath);

    /**
    @brief Encrypts a given plaintext using partition numbers 
    @param plaintext Plaintext to be encrypted
    @return Encrypted value Z
    */

    mpz_class encrypt(const std::string& password);

    /**
     * @brief Decrypt an encrypted value using the specified strategy
     * @param encryptedValue The Z value to decrypt
     * @param strategy The decryption strategy to use
     * @return Possible decryption results (may be multiple or none)
     */
    std::vector<std::string> decrypt(const mpz_class& encryptedValue, 
                                    std::shared_ptr<DecryptionStrategy> strategy);

    /**
     * @brief Get the lookup table
     * @return Reference to the lookup table
     */
    const std::unordered_map<char, mpz_class>& getLookupTable() const { return charToPartition; }

    /**
     * @brief Get the constant C used in encryption
     * @return The constant C value
     */
    mpz_class getConstantC() const { return constantC; }

protected:
    /**
     * @brief Load the lookup table from file
     * @param filePath Path to the lookup table file
     */
    void loadLookupTable(const std::string& filePath);

    /**
     * @brief Validate input password
     * @param password The password to validate
     * @throws std::invalid_argument if password doesn't meet requirements
     */
    void validatePassword(const std::string& password) const;

    std::unordered_map<char, mpz_class> charToPartition; // Maps characters to partition values
    std::unordered_map<mpz_class, char> partitionToChar; // Reverse mapping for decryption
    mpz_class constantC; // The constant C value
    unsigned int minPasswordLength; // Minimum allowed password length
    unsigned int maxPasswordLength; // Maximum allowed password length
};

/**
 * @class DecryptionStrategy
 * @brief Abstract base class for different decryption strategies
 */
class DecryptionStrategy {
public:
    /**
     * @brief Virtual destructor
     */
    virtual ~DecryptionStrategy() = default;
    
    /**
     * @brief Decrypt function to be implemented by concrete strategies
     * @param targetSum The K value (Z - C) to find partitioning for
     * @param charToPartition Map of characters to their partition values
     * @param minLength Minimum allowed password length
     * @param maxLength Maximum allowed password length
     * @return Possible decryption results (may be multiple or none)
     */
    virtual std::vector<std::string> decrypt(
        const mpz_class& targetSum,
        const std::unordered_map<char, mpz_class>& charToPartition,
        unsigned int minLength,
        unsigned int maxLength) = 0;
    
    /**
     * @brief Get the name of the strategy for display and benchmarking
     * @return The strategy name
     */
    virtual std::string getName() const = 0;

    /**
     * @brief Get performance metrics from the last decryption
     * @return String with performance information
     */
    std::string getPerformanceMetrics() const;

protected:
    // Performance tracking
    std::chrono::microseconds duration;
    size_t combinationsChecked = 0;
    size_t memoryUsed = 0; // Approximate memory usage in bytes
};

#endif // PARTITION_ENCRYPTION_H

