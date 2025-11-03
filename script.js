
        class BTreeNode {
            constructor(m, isLeaf = true) {
                this.m = m;
                this.keys = [];
                this.children = [];
                this.isLeaf = isLeaf;
            }
        }

        class BTree {
            constructor(m) {
                this.root = new BTreeNode(m, true);
                this.m = m;
                this.t = Math.ceil(m / 2);
            }

            search(k, node = this.root) {
                let i = 0;
                while (i < node.keys.length && k > node.keys[i]) {
                    i++;
                }

                if (i < node.keys.length && k === node.keys[i]) {
                    return node;
                }

                if (node.isLeaf) {
                    return null;
                }

                return this.search(k, node.children[i]);
            }

            insert(k) {
                let root = this.root;
                
                if (root.keys.length === this.m - 1) {
                    let newRoot = new BTreeNode(this.m, false);
                    newRoot.children.push(this.root);
                    this.splitChild(newRoot, 0);
                    this.root = newRoot;
                    this.insertNonFull(newRoot, k);
                } else {
                    this.insertNonFull(root, k);
                }
            }

            insertNonFull(node, k) {
                let i = node.keys.length - 1;

                if (node.isLeaf) {
                    node.keys.push(null);
                    while (i >= 0 && k < node.keys[i]) {
                        node.keys[i + 1] = node.keys[i];
                        i--;
                    }
                    node.keys[i + 1] = k;
                } else {
                    while (i >= 0 && k < node.keys[i]) {
                        i--;
                    }
                    i++;
                    
                    if (node.children[i].keys.length === this.m - 1) {
                        this.splitChild(node, i);
                        if (k > node.keys[i]) {
                            i++;
                        }
                    }
                    this.insertNonFull(node.children[i], k);
                }
            }

            splitChild(parent, i) {
                let fullChild = parent.children[i];
                let newChild = new BTreeNode(this.m, fullChild.isLeaf);
                let midIndex = Math.floor((this.m - 1) / 2);

                parent.keys.splice(i, 0, fullChild.keys[midIndex]);
                parent.children.splice(i + 1, 0, newChild);

                newChild.keys = fullChild.keys.splice(midIndex + 1);
                fullChild.keys.splice(midIndex, 1);
                
                if (!fullChild.isLeaf) {
                    newChild.children = fullChild.children.splice(midIndex + 1);
                }
            }

            delete(k) {
                this.deleteKey(this.root, k);
                
                if (this.root.keys.length === 0) {
                    if (!this.root.isLeaf && this.root.children.length > 0) {
                        this.root = this.root.children[0];
                    }
                }
            }

            deleteKey(node, k) {
                let i = 0;
                while (i < node.keys.length && k > node.keys[i]) {
                    i++;
                }

                if (i < node.keys.length && k === node.keys[i]) {
                    if (node.isLeaf) {
                        node.keys.splice(i, 1);
                    } else {
                        this.deleteFromNonLeaf(node, i);
                    }
                } else if (!node.isLeaf) {
                    let isInSubtree = (i === node.keys.length);
                    
                    if (node.children[i].keys.length < this.t) {
                        this.fill(node, i);
                    }

                    if (isInSubtree && i > node.keys.length) {
                        this.deleteKey(node.children[i - 1], k);
                    } else {
                        this.deleteKey(node.children[i], k);
                    }
                }
            }

            deleteFromNonLeaf(node, i) {
                let k = node.keys[i];

                if (node.children[i].keys.length >= this.t) {
                    let pred = this.getPredecessor(node, i);
                    node.keys[i] = pred;
                    this.deleteKey(node.children[i], pred);
                } else if (node.children[i + 1].keys.length >= this.t) {
                    let succ = this.getSuccessor(node, i);
                    node.keys[i] = succ;
                    this.deleteKey(node.children[i + 1], succ);
                } else {
                    this.merge(node, i);
                    this.deleteKey(node.children[i], k);
                }
            }

            getPredecessor(node, i) {
                let curr = node.children[i];
                while (!curr.isLeaf) {
                    curr = curr.children[curr.children.length - 1];
                }
                return curr.keys[curr.keys.length - 1];
            }

            getSuccessor(node, i) {
                let curr = node.children[i + 1];
                while (!curr.isLeaf) {
                    curr = curr.children[0];
                }
                return curr.keys[0];
            }

            fill(node, i) {
                if (i !== 0 && node.children[i - 1].keys.length >= this.t) {
                    this.borrowFromPrev(node, i);
                } else if (i !== node.children.length - 1 && node.children[i + 1].keys.length >= this.t) {
                    this.borrowFromNext(node, i);
                } else {
                    if (i !== node.children.length - 1) {
                        this.merge(node, i);
                    } else {
                        this.merge(node, i - 1);
                    }
                }
            }

            borrowFromPrev(node, childIdx) {
                let child = node.children[childIdx];
                let sibling = node.children[childIdx - 1];

                child.keys.unshift(node.keys[childIdx - 1]);
                node.keys[childIdx - 1] = sibling.keys.pop();

                if (!child.isLeaf) {
                    child.children.unshift(sibling.children.pop());
                }
            }

            borrowFromNext(node, childIdx) {
                let child = node.children[childIdx];
                let sibling = node.children[childIdx + 1];

                child.keys.push(node.keys[childIdx]);
                node.keys[childIdx] = sibling.keys.shift();

                if (!child.isLeaf) {
                    child.children.push(sibling.children.shift());
                }
            }

            merge(node, i) {
                let child = node.children[i];
                let sibling = node.children[i + 1];

                child.keys.push(node.keys[i]);
                child.keys = child.keys.concat(sibling.keys);

                if (!child.isLeaf) {
                    child.children = child.children.concat(sibling.children);
                }

                node.keys.splice(i, 1);
                node.children.splice(i + 1, 1);
            }

            getHeight() {
                function height(node) {
                    if (node.isLeaf) return 1;
                    return 1 + height(node.children[0]);
                }
                return height(this.root);
            }
        }

        let btree = new BTree(5);
        let highlightedNode = null;
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');

        function updateProperties() {
            const m = parseInt(document.getElementById('order').value);
            document.getElementById('currentOrder').textContent = m;
            document.getElementById('maxKeys').textContent = m - 1;
            document.getElementById('maxChildren').textContent = m;
            document.getElementById('minKeys').textContent = Math.ceil(m / 2) - 1;
            document.getElementById('minChildren').textContent = Math.ceil(m / 2);
        }

        function showMessage(text, type) {
            const msgDiv = document.getElementById('message');
            msgDiv.textContent = text;
            msgDiv.className = `message message-${type}`;
            setTimeout(() => {
                msgDiv.textContent = '';
                msgDiv.className = '';
            }, 3000);
        }

        function insertValue() {
            const value = parseInt(document.getElementById('value').value);
            if (isNaN(value)) {
                showMessage('Please enter a valid number', 'error');
                return;
            }

            if (btree.search(value)) {
                showMessage(`Value ${value} already exists in the tree`, 'error');
                return;
            }

            btree.insert(value);
            showMessage(`Inserted ${value} successfully`, 'success');
            document.getElementById('value').value = '';
            highlightedNode = null;
            visualize();
        }

        function deleteValue() {
            const value = parseInt(document.getElementById('value').value);
            if (isNaN(value)) {
                showMessage('Please enter a valid number', 'error');
                return;
            }

            if (!btree.search(value)) {
                showMessage(`Value ${value} not found in the tree`, 'error');
                return;
            }

            btree.delete(value);
            showMessage(`Deleted ${value} successfully`, 'success');
            document.getElementById('value').value = '';
            highlightedNode = null;
            visualize();
        }

        function searchValue() {
            const value = parseInt(document.getElementById('value').value);
            if (isNaN(value)) {
                showMessage('Please enter a valid number', 'error');
                return;
            }

            const node = btree.search(value);
            if (node) {
                highlightedNode = node;
                showMessage(`Found ${value} in the tree (highlighted in gold)`, 'success');
                visualize();
            } else {
                highlightedNode = null;
                showMessage(`Value ${value} not found in the tree`, 'error');
                visualize();
            }
        }

        function generateTree() {
            const input = document.getElementById('generateValues').value.trim();
            if (!input) {
                showMessage('Please enter comma-separated values', 'error');
                return;
            }

            const values = input.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
            
            if (values.length === 0) {
                showMessage('No valid numbers found', 'error');
                return;
            }

            const order = parseInt(document.getElementById('order').value);
            btree = new BTree(order);
            highlightedNode = null;

            let inserted = 0;
            let skipped = 0;
            for (let value of values) {
                if (!btree.search(value)) {
                    btree.insert(value);
                    inserted++;
                } else {
                    skipped++;
                }
            }

            document.getElementById('generateValues').value = '';
            
            if (skipped > 0) {
                showMessage(`Generated tree with ${inserted} values (${skipped} duplicates skipped)`, 'info');
            } else {
                showMessage(`Generated tree with ${inserted} values successfully`, 'success');
            }
            
            visualize();
        }

        function generateRandomTree() {
            const count = parseInt(document.getElementById('randomCount').value);
            if (isNaN(count) || count < 5 || count > 50) {
                showMessage('Please enter a valid number between 5 and 50', 'error');
                return;
            }

            const order = parseInt(document.getElementById('order').value);
            btree = new BTree(order);
            highlightedNode = null;

            // Generate random unique values
            const values = new Set();
            while (values.size < count) {
                values.add(Math.floor(Math.random() * 200) + 1); // Random numbers 1-200
            }

            // Insert all values
            for (let value of values) {
                btree.insert(value);
            }

            showMessage(`Generated random tree with ${count} nodes successfully! 🎲`, 'success');
            visualize();
        }

        function clearTree() {
            const order = parseInt(document.getElementById('order').value);
            btree = new BTree(order);
            highlightedNode = null;
            updateProperties();
            showMessage('Tree cleared', 'info');
            visualize();
        }

        function visualize() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            if (!btree.root || btree.root.keys.length === 0) {
                canvas.width = 800;
                canvas.height = 400;
                ctx.font = '24px Segoe UI';
                ctx.fillStyle = '#6ee7b7';
                ctx.textAlign = 'center';
                ctx.fillText('Tree is empty. Insert values or generate a tree.', canvas.width / 2, canvas.height / 2);
                updateTreeInfo();
                return;
            }

            const BOX_WIDTH = 60;
            const BOX_HEIGHT = 50;
            const BOX_MARGIN = 5;
            const LEVEL_HEIGHT = 120;
            const HORIZONTAL_SPACING = 40;

            function calculatePositions(node, level = 0) {
                function traverse(n, lvl) {
                    const nodeInfo = {
                        node: n,
                        level: lvl,
                        children: []
                    };
                    
                    if (!n.isLeaf) {
                        for (let child of n.children) {
                            const childInfo = traverse(child, lvl + 1);
                            nodeInfo.children.push(childInfo);
                        }
                    }
                    
                    return nodeInfo;
                }
                
                return traverse(node, level);
            }

            function assignXPositions(nodeInfo, nextX = 0) {
                if (nodeInfo.node.isLeaf) {
                    const nodeWidth = nodeInfo.node.keys.length * (BOX_WIDTH + BOX_MARGIN);
                    nodeInfo.x = nextX + nodeWidth / 2;
                    return nextX + nodeWidth + HORIZONTAL_SPACING;
                }
                
                let currentX = nextX;
                const childXPositions = [];
                
                for (let childInfo of nodeInfo.children) {
                    currentX = assignXPositions(childInfo, currentX);
                    childXPositions.push(childInfo.x);
                }
                
                if (childXPositions.length > 0) {
                    nodeInfo.x = (childXPositions[0] + childXPositions[childXPositions.length - 1]) / 2;
                } else {
                    const nodeWidth = nodeInfo.node.keys.length * (BOX_WIDTH + BOX_MARGIN);
                    nodeInfo.x = nextX + nodeWidth / 2;
                    currentX = nextX + nodeWidth + HORIZONTAL_SPACING;
                }
                
                return currentX;
            }

            const rootInfo = calculatePositions(btree.root);
            const treeWidth = assignXPositions(rootInfo);
            
            function getMaxLevel(nodeInfo) {
                if (nodeInfo.children.length === 0) return nodeInfo.level;
                return Math.max(...nodeInfo.children.map(c => getMaxLevel(c)));
            }
            
            const maxLevel = getMaxLevel(rootInfo);
            canvas.width = Math.max(treeWidth + 100, 1000);
            canvas.height = (maxLevel + 1) * LEVEL_HEIGHT + 100;

            function drawConnections(nodeInfo) {
                const nodeY = nodeInfo.level * LEVEL_HEIGHT + 60;
                
                for (let childInfo of nodeInfo.children) {
                    const childY = childInfo.level * LEVEL_HEIGHT + 60;
                    
                    ctx.beginPath();
                    ctx.strokeStyle = '#34d399';
                    ctx.lineWidth = 2;
                    ctx.moveTo(nodeInfo.x, nodeY + BOX_HEIGHT);
                    ctx.lineTo(childInfo.x, childY);
                    ctx.stroke();
                    
                    drawConnections(childInfo);
                }
            }

            drawConnections(rootInfo);

            function drawNode(nodeInfo) {
                const node = nodeInfo.node;
                const x = nodeInfo.x;
                const y = nodeInfo.level * LEVEL_HEIGHT + 60;
                const isHighlighted = node === highlightedNode;
                
                const totalWidth = node.keys.length * (BOX_WIDTH + BOX_MARGIN) - BOX_MARGIN;
                const startX = x - totalWidth / 2;
                
                for (let i = 0; i < node.keys.length; i++) {
                    const boxX = startX + i * (BOX_WIDTH + BOX_MARGIN);
                    
                    if (isHighlighted) {
                        ctx.fillStyle = '#fbbf24';
                        ctx.strokeStyle = '#f59e0b';
                        ctx.shadowColor = 'rgba(251, 191, 36, 0.6)';
                        ctx.shadowBlur = 15;
                    } else {
                        ctx.fillStyle = '#10b981';
                        ctx.strokeStyle = '#059669';
                        ctx.shadowColor = 'rgba(16, 185, 129, 0.5)';
                        ctx.shadowBlur = 12;
                    }
                    
                    ctx.lineWidth = 3;
                    
                    ctx.beginPath();
                    ctx.roundRect(boxX, y, BOX_WIDTH, BOX_HEIGHT, 8);
                    ctx.fill();
                    ctx.stroke();
                    
                    ctx.shadowBlur = 0;
                    
                    ctx.fillStyle = 'white';
                    ctx.font = 'bold 20px Segoe UI';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(node.keys[i], boxX + BOX_WIDTH / 2, y + BOX_HEIGHT / 2);
                }
                
                for (let childInfo of nodeInfo.children) {
                    drawNode(childInfo);
                }
            }

            drawNode(rootInfo);
            updateTreeInfo();
        }

        function updateTreeInfo() {
            function countNodes(node) {
                if (!node) return 0;
                let count = 1;
                for (let child of node.children) {
                    count += countNodes(child);
                }
                return count;
            }

            function countKeys(node) {
                if (!node) return 0;
                let count = node.keys.length;
                for (let child of node.children) {
                    count += countKeys(child);
                }
                return count;
            }

            const nodeCount = countNodes(btree.root);
            const keyCount = countKeys(btree.root);
            const height = btree.getHeight();
            document.getElementById('treeInfo').textContent = `Nodes: ${nodeCount} | Total Keys: ${keyCount} | Height: ${height}`;
        }

        document.getElementById('btnInsert').addEventListener('click', insertValue);
        document.getElementById('btnDelete').addEventListener('click', deleteValue);
        document.getElementById('btnSearch').addEventListener('click', searchValue);
        document.getElementById('btnClear').addEventListener('click', clearTree);
        document.getElementById('btnGenerate').addEventListener('click', generateTree);
        document.getElementById('btnRandom').addEventListener('click', generateRandomTree);

        document.getElementById('value').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') insertValue();
        });

        document.getElementById('generateValues').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') generateTree();
        });

        document.getElementById('order').addEventListener('change', function() {
            const order = parseInt(this.value);
            if (order < 3) {
                this.value = 3;
                showMessage('Minimum order is 3', 'error');
                return;
            }
            if (order > 7) {
                this.value = 7;
                showMessage('Maximum order is 7', 'error');
                return;
            }
            clearTree();
        });

        updateProperties();
        visualize();
    