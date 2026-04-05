const samples = {
  c: {
    label: 'C Language',
    files: [
      {
        name: 'fibonacci.c',
        description: 'Fibonacci Series',
        code: `#include <stdio.h>

int main() {
    int n = 10, first = 0, second = 1, next, c;
    for(c = 0; c < n; c++) {
        if(c <= 1) 
            next = c;
        else {
            next = first + second;
            first = second;
            second = next;
        }
        printf("%d\\n", next);
    }
    return 0;
}`
      },
      {
        name: 'tower_of_hanoi.c',
        description: 'Tower of Hanoi',
        code: `#include <stdio.h>

void towerOfHanoi(int n, char from, char to, char aux) {
    if (n == 1) {
        printf("Move disk 1 from %c to %c\\n", from, to);
        return;
    }
    towerOfHanoi(n - 1, from, aux, to);
    printf("Move disk %d from %c to %c\\n", n, from, to);
    towerOfHanoi(n - 1, aux, to, from);
}

int main() {
    towerOfHanoi(3, 'A', 'C', 'B');
    return 0;
}`
      },
      {
        name: 'bfs.c',
        description: 'Breadth First Search',
        code: `#include <stdio.h>

int q[20], top = -1, front = -1, rear = -1, a[20][20], vis[20];

void add(int item) {
    if (rear == 19) 
        printf("QUEUE FULL");
    else {
        if (rear == -1) {
            q[++rear] = item;
            front++;
        } else {
            q[++rear] = item;
        }
    }
}

int delete() {
    int k;
    if ((front > rear) || (front == -1)) 
        return 0;
    else {
        k = q[front++];
        return k;
    }
}

void bfs(int s, int n) {
    int p, i;
    add(s);
    vis[s] = 1;
    p = delete();
    if (p != 0) printf(" %d", p);
    while (p != 0) {
        for (i = 1; i <= n; i++) {
            if ((a[p][i] != 0) && (vis[i] == 0)) {
                add(i);
                vis[i] = 1;
            }
        }
        p = delete();
        if (p != 0) printf(" %d ", p);
    }
    for (i = 1; i <= n; i++)
        if (vis[i] == 0) bfs(i, n);
}

int main() {
    return 0;
}`
      },
      {
        name: 'dfs.c',
        description: 'Depth First Search',
        code: `#include <stdio.h>

int a[20][20], reach[20], n;

void dfs(int v) {
    int i;
    reach[v] = 1;
    for (i = 1; i <= n; i++) {
        if (a[v][i] && !reach[i]) {
            printf("\\n %d->%d", v, i);
            dfs(i);
        }
    }
}

int main() {
    return 0;
}`
      },
      {
        name: 'binary_search.c',
        description: 'Binary Search',
        code: `#include <stdio.h>

int binarySearch(int arr[], int l, int r, int x) {
    while (l <= r) {
        int m = l + (r - l) / 2;
        if (arr[m] == x) 
            return m;
        if (arr[m] < x) 
            l = m + 1;
        else 
            r = m - 1;
    }
    return -1;
}

int main() {
    int arr[] = {2, 3, 4, 10, 40};
    int n = sizeof(arr) / sizeof(arr[0]);
    int x = 10;
    printf("%d", binarySearch(arr, 0, n - 1, x));
    return 0;
}`
      }
    ]
  },
  cpp: {
    label: 'C++ Language',
    files: [
      {
        name: 'fibonacci.cpp',
        description: 'Fibonacci Series',
        code: `#include <iostream>
using namespace std;

int main() {
    int n = 10, t1 = 0, t2 = 1, nextTerm = 0;
    for (int i = 1; i <= n; ++i) {
        if(i == 1) {
            cout << t1 << ", ";
            continue;
        }
        if(i == 2) {
            cout << t2 << ", ";
            continue;
        }
        nextTerm = t1 + t2;
        t1 = t2;
        t2 = nextTerm;
        cout << nextTerm << ", ";
    }
    return 0;
}`
      },
      {
        name: 'tower_of_hanoi.cpp',
        description: 'Tower of Hanoi',
        code: `#include <iostream>
using namespace std;

void towerOfHanoi(int n, char from_rod, char to_rod, char aux_rod) {
    if (n == 1) {
        cout << "Move disk 1 from rod " << from_rod << " to rod " << to_rod << endl;
        return;
    }
    towerOfHanoi(n - 1, from_rod, aux_rod, to_rod);
    cout << "Move disk " << n << " from rod " << from_rod << " to rod " << to_rod << endl;
    towerOfHanoi(n - 1, aux_rod, to_rod, from_rod);
}

int main() {
    int n = 4;
    towerOfHanoi(n, 'A', 'C', 'B');
    return 0;
}`
      },
      {
        name: 'bfs.cpp',
        description: 'Breadth First Search',
        code: `#include <iostream>
#include <vector>
#include <list>
using namespace std;

class Graph {
    int V;
    vector<list<int>> adj;

public:
    Graph(int V) {
        this->V = V;
        adj.resize(V);
    }

    void addEdge(int v, int w) { 
        adj[v].push_back(w); 
    }

    void BFS(int s) {
        vector<bool> visited(V, false);
        list<int> queue;

        visited[s] = true;
        queue.push_back(s);

        while (!queue.empty()) {
            s = queue.front();
            cout << s << " ";
            queue.pop_front();

            for (auto adjacent : adj[s]) {
                if (!visited[adjacent]) {
                    visited[adjacent] = true;
                    queue.push_back(adjacent);
                }
            }
        }
    }
};

int main() {
    Graph g(4);
    g.addEdge(0, 1);
    g.addEdge(0, 2);
    g.addEdge(1, 2);
    g.addEdge(2, 0);
    g.addEdge(2, 3);
    g.addEdge(3, 3);
    g.BFS(2);
    return 0;
}`
      },
      {
        name: 'dfs.cpp',
        description: 'Depth First Search',
        code: `#include <iostream>
#include <vector>
using namespace std;

class Graph {
    int V;
    vector<vector<int>> adj;

    void DFSUtil(int v, vector<bool>& visited) {
        visited[v] = true;
        cout << v << " ";
        for (int i : adj[v])
            if (!visited[i]) 
                DFSUtil(i, visited);
    }

public:
    Graph(int V) {
        this->V = V;
        adj.resize(V);
    }

    void addEdge(int v, int w) { 
        adj[v].push_back(w); 
    }

    void DFS(int v) {
        vector<bool> visited(V, false);
        DFSUtil(v, visited);
    }
};

int main() {
    Graph g(4);
    g.addEdge(0, 1);
    g.addEdge(0, 2);
    g.addEdge(1, 2);
    g.addEdge(2, 0);
    g.addEdge(2, 3);
    g.addEdge(3, 3);
    g.DFS(2);
    return 0;
}`
      },
      {
        name: 'binary_search.cpp',
        description: 'Binary Search',
        code: `#include <iostream>
using namespace std;

int binarySearch(int arr[], int l, int r, int x) {
    while (l <= r) {
        int m = l + (r - l) / 2;
        if (arr[m] == x) 
            return m;
        if (arr[m] < x) 
            l = m + 1;
        else 
            r = m - 1;
    }
    return -1;
}

int main() {
    int arr[] = { 2, 3, 4, 10, 40 };
    int x = 10;
    int n = sizeof(arr) / sizeof(arr[0]);
    int result = binarySearch(arr, 0, n - 1, x);

    (result == -1) 
        ? cout << "Not present" 
        : cout << "Present at index " << result;

    return 0;
}`
      }
    ]
  },
  python: {
    label: 'Python Language',
    files: [
      {
        name: 'fibonacci.py',
        description: 'Fibonacci Series',
        code: `def fibonacci(n):
    a, b = 0, 1
    for _ in range(n):
        yield a
        a, b = b, a + b

print(list(fibonacci(10)))`
      },
      {
        name: 'tower_of_hanoi.py',
        description: 'Tower of Hanoi',
        code: `def tower_of_hanoi(n, source, destination, auxiliary):
    if n == 1:
        print(f"Move disk 1 from {source} to {destination}")
        return
    tower_of_hanoi(n - 1, source, auxiliary, destination)
    print(f"Move disk {n} from {source} to {destination}")
    tower_of_hanoi(n - 1, auxiliary, destination, source)

tower_of_hanoi(3, 'A', 'C', 'B')`
      },
      {
        name: 'bfs.py',
        description: 'Breadth First Search',
        code: `import collections

def bfs(graph, root):
    visited, queue = set(), collections.deque([root])
    visited.add(root)
    
    while queue:
        vertex = queue.popleft()
        print(str(vertex) + " ", end="")
        
        for neighbour in graph[vertex]:
            if neighbour not in visited:
                visited.add(neighbour)
                queue.append(neighbour)

graph = {0: [1, 2], 1: [2], 2: [3], 3: [1, 2]}
bfs(graph, 0)`
      },
      {
        name: 'dfs.py',
        description: 'Depth First Search',
        code: `def dfs(graph, node, visited):
    if node not in visited:
        print(node, end=" ")
        visited.add(node)
        for neighbour in graph[node]:
            dfs(graph, neighbour, visited)

graph = {
    'A': ['B', 'C'], 
    'B': ['D', 'E'], 
    'C': ['F'], 
    'D': [], 
    'E': ['F'], 
    'F': []
}
dfs(graph, 'A', set())`
      },
      {
        name: 'binary_search.py',
        description: 'Binary Search',
        code: `def binary_search(arr, l, r, x):
    while l <= r:
        mid = l + (r - l) // 2
        if arr[mid] == x:
            return mid
        elif arr[mid] < x:
            l = mid + 1
        else:
            r = mid - 1
    return -1

arr = [2, 3, 4, 10, 40]
x = 10
res = binary_search(arr, 0, len(arr) - 1, x)

print(f"Index: {res}")`
      }
    ]
  }
};

module.exports = samples;
