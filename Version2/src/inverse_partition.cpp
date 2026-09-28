#include "inverse_partition.h"

#include <algorithm>
#include <cmath>
#include <stdexcept>

namespace {

constexpr double kPi = 3.14159265358979323846;

bool isValidDecimal(const std::string& s) {
    if (s.empty()) {
        return false;
    }
    return std::all_of(s.begin(), s.end(), [](char c) { return c >= '0' && c <= '9'; });
}

// ln(x) for an arbitrary-precision x, computed via mantissa/exponent so it
// doesn't overflow the way mpz_get_d() would for values beyond double's range.
double logOfMpz(const mpz_class& x) {
    signed long int exp2 = 0;
    double mantissa = mpz_get_d_2exp(&exp2, x.get_mpz_t());
    return std::log(mantissa) + exp2 * std::log(2.0);
}

} // namespace

std::vector<mpz_class> computePartitionTable(unsigned long n) {
    std::vector<mpz_class> p(n + 1, mpz_class(0));
    p[0] = 1;

    for (unsigned long i = 1; i <= n; ++i) {
        mpz_class total = 0;
        long long k = 1;

        while (true) {
            long long g1 = k * (3 * k - 1) / 2;
            long long g2 = k * (3 * k + 1) / 2;

            if (static_cast<unsigned long long>(g1) > i && static_cast<unsigned long long>(g2) > i) {
                break;
            }

            bool positiveSign = (k % 2 != 0);

            if (static_cast<unsigned long long>(g1) <= i) {
                if (positiveSign) {
                    total += p[i - static_cast<unsigned long>(g1)];
                } else {
                    total -= p[i - static_cast<unsigned long>(g1)];
                }
            }
            if (static_cast<unsigned long long>(g2) <= i) {
                if (positiveSign) {
                    total += p[i - static_cast<unsigned long>(g2)];
                } else {
                    total -= p[i - static_cast<unsigned long>(g2)];
                }
            }

            ++k;
        }

        p[i] = total;
    }

    return p;
}

std::optional<unsigned long> invertPartition(const std::string& partitionValueDecimal) {
    if (!isValidDecimal(partitionValueDecimal)) {
        throw std::invalid_argument("Partition value must be a non-negative decimal integer");
    }

    mpz_class target(partitionValueDecimal);

    if (target < 1) {
        // p(n) >= 1 for every n >= 0, so anything below that matches nothing.
        return std::nullopt;
    }

    // Hardy-Ramanujan asymptotic inversion: n ~ (3/2)(ln p / pi)^2.
    // Inaccurate for small n (the formula is asymptotic), which is why the
    // window below is grown until it's confirmed to bracket the target.
    double logP = logOfMpz(target);
    double n0 = (3.0 / 2.0) * std::pow(logP / kPi, 2.0);

    unsigned long hi = std::max<unsigned long>(10, static_cast<unsigned long>(n0 * 1.2) + 10);
    std::vector<mpz_class> table = computePartitionTable(hi);

    while (table.back() < target) {
        hi *= 2;
        table = computePartitionTable(hi);
    }

    // p is non-decreasing (strictly increasing from n=1 onward, with
    // p(0) == p(1) == 1), so binary search for the smallest matching n.
    auto it = std::lower_bound(table.begin(), table.end(), target);
    if (it != table.end() && *it == target) {
        return static_cast<unsigned long>(it - table.begin());
    }

    return std::nullopt;
}
