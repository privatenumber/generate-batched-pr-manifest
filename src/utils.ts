import { execa } from 'execa';
import task from 'tasuku';

type PullRequestData = {
	baseRefName: string;
	headRefName: string;
	headRepositoryOwner: {
		login: string;
	};
	headRepository: {
		name: string;
	};
	commits: {
		oid: string;
	}[];
};

type SearchResultPullRequest = {
	number: number;
	url: string;
	state: 'open' | 'closed' | 'merged';
};

export const assertHasGh = async () => {
	const { failed, stdout } = await execa('gh', ['--version'], {
		reject: false,
	});

	if (failed || !stdout.includes('https://github.com/cli/cli/releases/tag/')) {
		throw new Error('You must have GitHub CLI installed to use this command: https://cli.github.com');
	}
};

export const getPrData = async (
	prNumber: number,
) => {
	const fetchPR = await task(`Fetching PR #${prNumber}`, async () => {
		const { stdout: data } = await execa(
			'gh',
			['pr', 'view', prNumber.toString(), '--json', 'commits,baseRefName,headRefName,headRepositoryOwner,headRepository'],
		);
		return JSON.parse(data) as PullRequestData;
	});

	fetchPR.clear();
	return fetchPR.result;
};

export const searchForPrs = async (
	repoName: string,
	commitShas: string[],
	baseBranch: string,
) => {
	const results: SearchResultPullRequest[] = [];
	const queue = commitShas.slice();

	while (queue.length > 0) {
		const commits = queue.splice(0, 20);
		const searchPRs = await task(`Searching PRs with base: ${baseBranch}`, async () => {
			const { stdout } = await execa(
				'gh',
				['search', 'prs', `--repo=${repoName}`, `--base=${baseBranch}`, '--json', 'number,url,state', ...commits],
			);
			results.push(...JSON.parse(stdout));
		});
		searchPRs.clear();
	}

	return results;
};

export const updatePr = async (
	prNumber: number,
	title: string,
	body: string,
) => {
	const update = await task(`Updating PR #${prNumber}`, async () => {
		await execa('gh', ['pr', 'edit', prNumber.toString(), '--title', title, '--body', body]);
	});
	update.clear();
};
