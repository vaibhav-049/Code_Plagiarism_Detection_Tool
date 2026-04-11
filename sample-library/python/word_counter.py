def word_count(text):
    words = text.lower().split()
    counts = {}
    for word in words:
        counts[word] = counts.get(word, 0) + 1
    return counts

sample = "apple banana apple orange banana apple"
print(word_count(sample))
