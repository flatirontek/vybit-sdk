import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class VybitApi implements ICredentialType {
	name = 'vybitApi';
	displayName = 'API Key';
	documentationUrl = 'https://developer.vybit.net/api-reference';

	// Key description for users
	description = 'Advanced: Use your Vybit Developer API key for full programmatic access. Get your API key from developer.vybit.net';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Your Vybit Developer API key from <a href="https://developer.vybit.net" target="_blank">developer.vybit.net</a>. For different environments (dev, staging, production), create separate Vybit accounts and use different API keys.',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.vybit.net/v1',
			required: true,
			description: 'The Vybit API base URL (default: https://api.vybit.net/v1). Use the production API with different API keys for different environments.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-API-Key': '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/status',
			method: 'GET',
		},
	};
}
