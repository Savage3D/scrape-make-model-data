const puppeteer = require('puppeteer');
const { writeFileSync } = require('fs');

const url = 'https://www.mobile.de/?lang=en';

function saveToFile(data) {
	const jsonString = JSON.stringify(data);
	writeFileSync('./data/make-model-list.json', jsonString);
}

async function getModels(page) {
	const optionElements = await page.$$('select#qsmodelBuy option');

	const models = [];
	let series = null;

	for (const e of optionElements) {
		const name = await (await e.getProperty('innerText')).jsonValue();
		const value = await (await e.getProperty('value')).jsonValue();

		if (name !== 'Any' && name !== '') {
			if (value.startsWith('g')) {
				series = name;
			} else if (/^\s/.test(name)) {
				models.push({ name: name.trim(), series });
			} else {
				models.push({ name, series: null });
			}
		}
	}
	return models;
}

async function getMakes(page) {
	const optionElements = await page.$$('select#qsmakeBuy option:not(.pmak)');

	const makes = [];
	for (const el of optionElements) {
		const name = await (await el.getProperty('innerText')).jsonValue();

		if (name !== 'Any' && name !== '') {
			const value = await (await el.getProperty('value')).jsonValue();

			console.log(`Processing '${name}'...`);
			await page.select('select#qsmakeBuy', value);
			await page.waitFor(500);

			const models = await getModels(page);
			makes.push({ name, models });
		}
	}
	return makes;
}

async function main() {
	try {
		const browser = await puppeteer.launch({ headless: false });
		const page = await browser.newPage();
		await page.goto(url);

		const makes = await getMakes(page);

		await browser.close();
		saveToFile(makes);
	} catch (error) {
		console.log(error);
	}
}

main();
