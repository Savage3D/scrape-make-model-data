const { writeFileSync, readFileSync } = require('fs');

const makesTable = 'CarMakes';
const modelsTable = 'CarModels';

const insertMakesStr = `INSERT INTO ${makesTable} (Id, Name) VALUES \n`;
const insertModelsStr = `INSERT INTO ${modelsTable} (Id, MakeId, Name, Series) VALUES \n`;

function sanitize(str) {
	return str.replace(/'/g, "''");
}

function setIdentityInsert(table, status = 'ON' /* or 'OFF' */) {
	return `SET IDENTITY_INSERT ${table} ${status};\n`;
}

function normalizeQueryEnding(query) {
	let result = query.slice(0, -2);
	result += ';\n';
	return result;
}

function getQueryForMakes(data) {
	let result = setIdentityInsert(makesTable, 'ON');
	result += insertMakesStr;

	let makeId = 1;
	for (const make of data) {
		result += `\t(${makeId}, '${sanitize(make.name)}'),\n`;
		makeId++;
	}

	result = normalizeQueryEnding(result);
	result += setIdentityInsert(makesTable, 'OFF');
	return result;
}

function getQueryForModels(data) {
	let result = setIdentityInsert(modelsTable, 'ON');
	result += insertModelsStr;

	let makeId = 1;
	let modelId = 1;
	for (const make of data) {
		for (const model of make.models) {
			const seriesStr = model.series ? `'${sanitize(model.series)}'` : 'NULL';
			result += `\t(${modelId}, ${makeId}, '${sanitize(model.name)}', ${seriesStr}),\n`;
			modelId++;
			if (modelId % 1000 === 0) {
				result = normalizeQueryEnding(result);
				result += insertModelsStr;
			}
		}
		makeId++;
	}

	result = normalizeQueryEnding(result);
	result += setIdentityInsert(modelsTable, 'OFF');
	return result;
}

async function main() {
	try {
		const rawData = readFileSync('./data/make-model-list.json').toString();
		const carData = JSON.parse(rawData);

		const query = getQueryForMakes(carData) + getQueryForModels(carData);

		writeFileSync('./data/query.sql', query);
	} catch (error) {
		console.log(error);
	}
}

main();
