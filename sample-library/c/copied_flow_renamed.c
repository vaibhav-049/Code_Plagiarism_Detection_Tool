#include <stdio.h>

void reorderValues(int values[], int size) {
    for (int outer = 0; outer < size - 1; outer++) {
        for (int inner = 0; inner < size - outer - 1; inner++) {
            if (values[inner] > values[inner + 1]) {
                int swapSlot = values[inner];
                values[inner] = values[inner + 1];
                values[inner + 1] = swapSlot;
            }
        }
    }
}

int weightedSum(int values[], int size) {
    int accumulator = 0;
    for (int index = 0; index < size; index++) {
        accumulator += values[index] * (index + 1);
    }
    return accumulator;
}

int main(void) {
    int sample[] = {7, 2, 9, 1, 5, 4};
    int length = sizeof(sample) / sizeof(sample[0]);

    reorderValues(sample, length);
    printf("checksum=%d\n", weightedSum(sample, length));

    return 0;
}
