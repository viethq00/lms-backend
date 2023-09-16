const fs = require('fs');
const path = require('path');

module.exports = {
    checkFormatExcel: function (title, excelFormat) {
        for (let i = 0; i < excelFormat.length; i++) {
            if (title[i] !== excelFormat[i]) {
                return false;
            }
        }
        return true;
    },
    checkFileExists: function (fileName) {
        const folder = path.join(__dirname, '../uploads/file_example/' + fileName);
        if (fs.existsSync(folder)) {
            return true;
        }
        return false;
    },
    checkFileCsvExists: function (fileName) {
        const folder = path.join(__dirname, '../uploads/export/' + fileName);
        if (fs.existsSync(folder)) {
            return true;
        }
        return false;
    },
    getRank: function (numberCorrect, numberQuestion) {
        const percentage = (Math.round((numberCorrect / numberQuestion) * 1000) / 1000).toFixed(2);
        if (percentage >= 0.9) return 'S';
        if (percentage >= 0.7 && percentage <= 0.89) return 'A';
        if (percentage >= 0.4 && percentage <= 0.69) return 'B';
        if (percentage >= 0.16 && percentage <= 0.39) return 'C';
        if (percentage <= 0.15) return 'D';
    },
    checkFileImageExists: function (fileName) {
        const folder = path.join(__dirname, '../uploads/image/' + fileName);
        if (fs.existsSync(folder)) {
            return true;
        }
        return false;
    },
    checkFileAnimationExists: function (fileName) {
        const folder = path.join(__dirname, '../uploads/animation/' + fileName);
        if (fs.existsSync(folder)) {
            return true;
        }
        return false;
    },
    checkLevelUp: function (rank_old, rank_new) {
        if (
            rank_old === rank_new ||
            (rank_old === 'S' &&
                (rank_new === 'A' || rank_new === 'B' || rank_new === 'C' || rank_new === 'D')) ||
            (rank_old === 'A' && (rank_new === 'B' || rank_new === 'C' || rank_new === 'D')) ||
            (rank_old === 'B' && (rank_new === 'C' || rank_new === 'D')) ||
            (rank_old === 'C' && rank_new === 'D')
        ) {
            return false;
        }
        return true;
    },
};
