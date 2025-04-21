const fs = require('fs');
const path = require('path');

const directoryPath = '/Proyectos/The 25th Ward/export';

// Use fs.readdir to read the contents of the directory asynchronously
fs.readdir(directoryPath, (err, items) => {
    if (err) {
        console.error('Error reading directory:', err);
        return;
    }

    // Use async forEach to filter and log only files
    items.forEach((item) => {
        const itemPath = path.join(directoryPath, item);
        fs.stat(itemPath, (statErr, stats) => {
            if (stats && stats.isFile()) {
                if (item.split('.')[1] === 'png') {
                    const newName = item.split('.')[0].toLocaleUpperCase() + '.' + item.split('.')[1]
                    console.log('File:', newName);

                    fs.rename(itemPath, path.join(directoryPath, newName), err => {
                        if (err) throw err;
                        console.log(`${item} was renamed to ${newName}`);
                    });

                }

            }
        });
    });
});