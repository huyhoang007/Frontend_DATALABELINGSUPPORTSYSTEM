const fs = require('fs');

try {
    const data = JSON.parse(fs.readFileSync('figma_data.json', 'utf8'));

    if (data.status === 403 || data.err) {
        console.error("Figma API error:", data);
        process.exit(1);
    }

    const document = data.document;
    if (!document) {
        console.error("No document found in response");
        process.exit(1);
    }

    console.log(`Document Name: ${data.name}`);
    console.log("=========================================");
    console.log("Pages and Frames:");

    function extractFrames(node, depth, targetNames) {
        let indent = '  '.repeat(depth);
        if (node.type === 'CANVAS' || node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
            console.log(`${indent}- [${node.type}] ${node.name} (ID: ${node.id})`);

            // If it's a target frame, let's print some layout hints
            if (node.type === 'FRAME' && depth > 0) {
                let layoutInfo = [];
                if (node.layoutMode) layoutInfo.push(`layoutMode: ${node.layoutMode}`);
                if (node.primaryAxisSizingMode) layoutInfo.push(`primaryAxis: ${node.primaryAxisSizingMode}`);
                if (node.counterAxisSizingMode) layoutInfo.push(`counterAxis: ${node.counterAxisSizingMode}`);
                if (node.paddingLeft || node.paddingTop) layoutInfo.push(`padding: ${node.paddingTop}px ${node.paddingRight}px ${node.paddingBottom}px ${node.paddingLeft}px`);
                if (node.itemSpacing) layoutInfo.push(`gap: ${node.itemSpacing}px`);
                if (node.fills && node.fills.length) {
                    let fill = node.fills[0];
                    if (fill.type === 'SOLID' && fill.color) {
                        layoutInfo.push(`bg: rgba(${Math.round(fill.color.r * 255)},${Math.round(fill.color.g * 255)},${Math.round(fill.color.b * 255)},${fill.color.a})`);
                    }
                }
                if (layoutInfo.length > 0) {
                    console.log(`${indent}  Details: ${layoutInfo.join(', ')}`);
                }
            }
        }

        if (node.children) {
            // Don't go too deep for general listing, just top level Pages and their major Frames
            if (depth < 2) {
                node.children.forEach(child => extractFrames(child, depth + 1, targetNames));
            } else {
                // If it's a specific interesting frame, dump its immediate children to understand the structure
                const interestingNames = [
                    "Upload Data", "Quản lí nhãn/Labels", "Add Labels/Create Label",
                    "Add New Error Type", "Quản lí nhiệm vụ/Tasks", "Export",
                    "Labels", "Create Label", "Tasks", "Upload"
                ];
                if (interestingNames.some(name => (node.name || "").toLowerCase().includes(name.toLowerCase()))) {
                    node.children.forEach(child => {
                        console.log(`${indent}  -> [${child.type}] ${child.name} (ID: ${child.id})`);
                    });
                }
            }
        }
    }

    extractFrames(document, 0, []);

    console.log("\n=========================================");
    console.log("Tokens & Styles (Summary):");
    if (data.styles) {
        console.log(`Total styles defined: ${Object.keys(data.styles).length}`);
        let types = {};
        Object.values(data.styles).forEach(s => {
            types[s.styleType] = (types[s.styleType] || 0) + 1;
        });
        console.log(types);
    }

} catch (e) {
    console.error("Error parsing JSON:", e.message);
}
