import type {
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

// Client ID and Client Secret are inherited from oAuth2Api and deliberately not
// redeclared here: on n8n Cloud they are supplied by n8n's Managed OAuth
// credential overwrite, so users see a single Connect button. Self-hosted
// instances still show the inherited fields for a bring-your-own OAuth app.
export class VybitOAuth2Api implements ICredentialType {
	name = 'vybitOAuth2Api';
	displayName = 'Vybit OAuth2 API';
	icon = 'file:vybit.png' as const;
	documentationUrl = 'https://github.com/flatirontek/vybit-sdk/tree/main/packages/n8n-nodes#credentials';

	// Key description for users
	description = 'Connect your Vybit account to n8n. You will be asked to authorize access to your vybits.';

	extends = ['oAuth2Api'];

	properties: INodeProperties[] = [
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			default: 'authorizationCode',
		},
		{
			displayName: 'Authorization URL',
			name: 'authUrl',
			type: 'hidden',
			default: 'https://app.vybit.net',
			required: true,
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			default: 'https://app.vybit.net/service/token',
			required: true,
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'hidden',
			default: '',
		},
		{
			displayName: 'Auth URI Query Parameters',
			name: 'authQueryParameters',
			type: 'hidden',
			default: '',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'body',
		},
	];

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.vybit.net/v1',
			url: '/status',
			method: 'GET',
		},
	};
}
