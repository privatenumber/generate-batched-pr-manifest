import { cli } from 'cleye';
import { green, red } from 'kolorist';
import { version, description } from '../package.json';
import {
	assertHasGh,
	getPrData,
	searchForPrs,
	updatePr,
} from './utils.js';

cli({
	name: 'generate-batched-pr-manifest',

	version,

	help: {
		description,
	},

	flags: {
		update: {
			type: Boolean,
			description: 'Update the PR title & description with the manifest',
		},
	},

	parameters: [
		'<number>',
	],
}, (argv) => {
	(async () => {
		await assertHasGh();
		const prNumber = Number(argv._.number);
		const {
			baseRefName,
			headRefName,
			commits,
			headRepositoryOwner,
			headRepository,
		} = await getPrData(prNumber);
		const repoName = `${headRepositoryOwner.login}/${headRepository.name}`;
		const commitList = commits.map(({ oid }) => oid.slice(0, 7));
		const resultsAgainstHead = await searchForPrs(repoName, commitList, headRefName);
		const resultsAgainstBase = await searchForPrs(repoName, commitList, baseRefName);
		const filtered = [
			...resultsAgainstBase,
			...resultsAgainstHead,
		]
			.filter(pr => (
				pr.number !== prNumber
				&& pr.state !== 'closed'
			))
			.map(({ url }) => url)
			.sort();

		if (filtered.length === 0) {
			console.warn('No pull-requests found');
			return;
		}

		const uniquePrs = Array.from(new Set(filtered));
		const manifest = `# Pull requests\n${
			uniquePrs.map(url => `- ${url}`).join('\n')
		}`;

		if (argv.flags.update) {
			const isoDate = (new Date()).toISOString().split('T')[0];
			await updatePr(
				prNumber,
				`batch: ${isoDate} (${uniquePrs.length.toLocaleString()} PRs)`,
				manifest,
			);
			console.log(`${green('✔')} Successfully updated the PR\n`);
		}

		console.log(manifest);
	})().catch((error) => {
		console.error(`${red('✖')} ${error.message}`);
		process.exitCode = 1;
	});
});
