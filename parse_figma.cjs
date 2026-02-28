const fs = require('fs');

try {
    const data = JSON.parse(fs.readFileSync('figma_data.json', 'utf8'));
    const document = data.document;

    console.log(`Document Name: ${data.name}`);
    console.log("=========================================");

    function extractText(node) {
        let text = "";
        if (node.type === 'TEXT') {
            text += node.characters + " ";
        }
        if (node.children) {
            node.children.forEach(c => text += extractText(c));
        }
        return text.trim();
    }

    // Find all frames and collect their texts
    let frames = [];

    function collectFrames(node, parentPath) {
        if (node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'INSTANCE') {
            frames.push({
                id: node.id,
                name: node.name,
                type: node.type,
                texts: extractText(node).replace(/\n/g, ' '),
                layoutMode: node.layoutMode,
                children: node.children
            });
        }
        if (node.children) {
            node.children.forEach(c => collectFrames(c, parentPath + '/' + node.name));
        }
    }

    collectFrames(document, 'ROOT');

    const targetKeywords = [
        "Upload Data", "Quản lí nhãn", "Add Labels", "Create Label",
        "Error Type", "Quản lí nhiệm vụ", "Tasks", "Export"
    ];

    for (let kw of targetKeywords) {
        console.log(`\n============== Searching for: "${kw}" ==============`);
        let matches = frames.filter(f => f.texts.toLowerCase().includes(kw.toLowerCase()) && (f.type === 'FRAME' || f.type === 'COMPONENT') && f.children && f.children.length > 3);

        // Sort to prefer smaller, more specific frames instead of the root frame
        matches.sort((a, b) => a.texts.length - b.texts.length);

        let bestMatch = matches[0];
        if (bestMatch) {
            console.log(`Found in [${bestMatch.type}] "${bestMatch.name}" (${bestMatch.id})`);
            console.log(`Layout: ${bestMatch.layoutMode || 'NONE'}`);
            console.log(`Texts: ${bestMatch.texts.substring(0, 200)}...`);

            let subTree = (bestMatch.children || []).map(c => {
                let t = extractText(c).substring(0, 30).replace(/\n/g, '');
                return `[${c.type}] ${c.name} ${t ? '(' + t + ')' : ''}`;
            }).join('\n  ');
            console.log(`Children:\n  ${subTree}`);
        } else {
            console.log(`Not found.`);
        }
    }

} catch (e) {
    console.error("Error parsing JSON:", e.message);
}
