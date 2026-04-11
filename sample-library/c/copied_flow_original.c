#include <stdio.h>

void bubbleSortCore(int numbers[], int count) {
    for (int i = 0; i < count - 1; i++) {
        for (int j = 0; j < count - i - 1; j++) {
            if (numbers[j] > numbers[j + 1]) {
                int temp = numbers[j];
                numbers[j] = numbers[j + 1];
                numbers[j + 1] = temp;
            }
        }
    }
}

int computeChecksum(int numbers[], int count) {
    int total = 0;
    for (int i = 0; i < count; i++) {
        total += numbers[i] * (i + 1);
    }
    return total;
}

int main(void) {
    int data[] = {7, 2, 9, 1, 5, 4};
    int n = sizeof(data) / sizeof(data[0]);

    bubbleSortCore(data, n);
    printf("checksum=%d\n", computeChecksum(data, n));

    return 0;
}
