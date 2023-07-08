function calculateInversePartition(partitionNum: string) -> string:
    numDigits = length(partitionNum)
    dp = array of size (numDigits + 1) initialized to 0
    dp[0] = 1

    for i = 1 to numDigits:
        parallel for j = i to numDigits:
            dp[j] += dp[j - i]

    inversePartition = convertToString(dp[numDigits])
    return inversePartition

partitionNum = readStringFromUser()
inversePartition = calculateInversePartition(partitionNum)
print("The inverse of partitions for " + partitionNum + " is " + inversePartition)
