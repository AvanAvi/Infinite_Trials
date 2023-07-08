import math
import itertools

def partition(n):
    a = [0 for _ in range(n + 1)]
    a[0] = 1
    for i in range(1, n + 1):
        j = 1
        k = 1
        while i - j >= 0:
            a[i] += a[i - j]
            j += k if k > 0 else -k
            k = -k if k > 0 else -k - 2
    return a[n]

partitions = partition(171)
print(partitions)
