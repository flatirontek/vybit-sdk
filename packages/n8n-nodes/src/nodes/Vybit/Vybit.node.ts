import type {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import { VybitAPIClient } from '@vybit/api-sdk';
import { VybitOAuth2Client } from '@vybit/oauth2-sdk';

export class Vybit implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Vybit Push Notifications',
		name: 'vybit',
		icon: 'file:vybit.png',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["actionType"]}}',
		description: 'Send notifications with personalized sounds',
		defaults: {
			name: 'Vybit Push Notifications',
		},
		inputs: ['main'],
		outputs: ['main'],
		codex: {
			categories: ['Communication'],
			subcategories: {
				Communication: ['Notifications'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://developer.vybit.net',
					},
				],
			},
		},
		credentials: [
			{
				name: 'vybitOAuth2Api',
				required: true,
				displayOptions: {
					show: {
						authentication: ['oAuth2'],
					},
				},
			},
			{
				name: 'vybitApi',
				required: true,
				displayOptions: {
					show: {
						authentication: ['apiKey'],
					},
				},
			},
		],
		properties: [
			// Authentication selection FIRST
			{
				displayName: 'Authentication',
				name: 'authentication',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'OAuth2',
						value: 'oAuth2',
						description: 'Connect your Vybit account (recommended for notifications)',
					},
					{
						name: 'API Key',
						value: 'apiKey',
						description: 'Developer API key (advanced features)',
					},
				],
				default: 'oAuth2',
			},
			// Action Type for OAuth2 - just notification
			{
				displayName: 'Action Type',
				name: 'actionType',
				type: 'hidden',
				displayOptions: {
					show: {
						authentication: ['oAuth2'],
					},
				},
				default: 'notification',
			},
			// Action Type for API Key - all options
			{
				displayName: 'Resource',
				name: 'actionType',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						authentication: ['apiKey'],
					},
				},
				options: [
					{
						name: 'Profile',
						value: 'profile',
						description: 'View profile and usage metrics',
						action: 'View profile',
					},
					{
						name: 'Vybits',
						value: 'vybits',
						description: 'Manage vybits (custom notifications)',
						action: 'Manage vybits',
					},
					{
						name: 'Logs',
						value: 'logs',
						description: 'View notification logs',
						action: 'View logs',
					},
					{
						name: 'Sounds',
						value: 'sounds',
						description: 'Search and manage sounds',
						action: 'Manage sounds',
					},
					{
						name: 'Peeps',
						value: 'peeps',
						description: 'Manage vybit invitations',
						action: 'Manage peeps',
					},
					{
						name: 'Subscriptions',
						value: 'subscriptions',
						description: 'Manage vybit subscriptions',
						action: 'Manage subscriptions',
					},
				],
				default: 'vybits',
			},
			// Notification operation (OAuth2) - simplified, just pick vybit
			{
				displayName: 'Vybit',
				name: 'triggerKey',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getVybits',
				},
				required: true,
				displayOptions: {
					show: {
						actionType: ['notification'],
					},
				},
				default: '',
				description: 'Select which vybit to trigger',
			},
			// ===== PROFILE OPERATIONS =====
			{
				displayName: 'Operation',
				name: 'apiOperation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						actionType: ['profile'],
					},
				},
				options: [
					{
						name: 'Get Profile',
						value: 'getProfile',
						description: 'Get user profile information',
					},
					{
						name: 'Get Usage Metrics',
						value: 'getMeter',
						description: 'Get current usage statistics and tier limits',
					},
					{
						name: 'Check API Status',
						value: 'getStatus',
						description: 'Check API service health and availability',
					},
				],
				default: 'getProfile',
			},
			// ===== VYBITS OPERATIONS =====
			{
				displayName: 'Operation',
				name: 'apiOperation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						actionType: ['vybits'],
					},
				},
				options: [
					{
						name: 'List',
						value: 'list',
						description: 'Get a list of your vybits',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get details of a specific vybit',
					},
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new vybit',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update an existing vybit',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a vybit',
					},
					{
						name: 'Trigger',
						value: 'trigger',
						description: 'Trigger a vybit notification',
					},
				],
				default: 'list',
			},
			// ===== SUBSCRIPTIONS OPERATIONS =====
			{
				displayName: 'Operation',
				name: 'apiOperation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						actionType: ['subscriptions'],
					},
				},
				options: [
					{
						name: 'List Public Vybits',
						value: 'listPublic',
						description: 'Browse publicly available vybits',
					},
					{
						name: 'Get Public Vybit',
						value: 'getPublic',
						description: 'Get details of a public vybit',
					},
					{
						name: 'Subscribe',
						value: 'subscribe',
						description: 'Subscribe to a vybit',
					},
					{
						name: 'List My Subscriptions',
						value: 'listSubscriptions',
						description: 'Get list of vybits you subscribe to',
					},
					{
						name: 'Get Subscription',
						value: 'getSubscription',
						description: 'Get details of a subscription',
					},
					{
						name: 'Update Subscription',
						value: 'updateSubscription',
						description: 'Update subscription settings',
					},
					{
						name: 'Unsubscribe',
						value: 'unsubscribe',
						description: 'Unsubscribe from a vybit',
					},
					{
						name: 'Send to Owner',
						value: 'sendToOwner',
						description: 'Send notification to vybit owner',
					},
					{
						name: 'Send to Group',
						value: 'sendToGroup',
						description: 'Send notification to all subscribers',
					},
				],
				default: 'listPublic',
			},
			// ===== SOUNDS OPERATIONS =====
			{
				displayName: 'Operation',
				name: 'apiOperation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						actionType: ['sounds'],
					},
				},
				options: [
					{
						name: 'Search',
						value: 'search',
						description: 'Search for sounds',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get sound details',
					},
				],
				default: 'search',
			},
			// ===== LOGS OPERATIONS =====
			{
				displayName: 'Operation',
				name: 'apiOperation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						actionType: ['logs'],
					},
				},
				options: [
					{
						name: 'List All',
						value: 'listAll',
						description: 'List all notification logs',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get a specific log entry',
					},
					{
						name: 'List by Vybit',
						value: 'listByVybit',
						description: 'List logs for a specific vybit',
					},
					{
						name: 'List by Subscription',
						value: 'listBySubscription',
						description: 'List logs for a specific subscription',
					},
				],
				default: 'listAll',
			},
			// ===== PEEPS OPERATIONS =====
			{
				displayName: 'Operation',
				name: 'apiOperation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						actionType: ['peeps'],
					},
				},
				options: [
					{
						name: 'List All',
						value: 'listAll',
						description: 'List all peep invitations',
					},
					{
						name: 'List by Vybit',
						value: 'listByVybit',
						description: 'List peeps for a specific vybit',
					},
					{
						name: 'Invite',
						value: 'create',
						description: 'Invite a user to a vybit',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get peep details',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Remove a peep invitation',
					},
				],
				default: 'listAll',
			},
			// ===== COMMON PARAMETER FIELDS =====

			// Vybit Key (used by vybits, logs, peeps resources)
			{
				displayName: 'Vybit Key',
				name: 'vybitKey',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						actionType: ['vybits'],
						apiOperation: ['get', 'trigger', 'update', 'delete'],
					},
				},
				default: '',
				description: 'The unique key of the vybit',
			},
			// Vybit Key for logs
			{
				displayName: 'Vybit Key',
				name: 'vybitKey',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						actionType: ['logs'],
						apiOperation: ['listByVybit'],
					},
				},
				default: '',
				description: 'The unique key of the vybit',
			},
			// Vybit Key for peeps
			{
				displayName: 'Vybit Key',
				name: 'vybitKey',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						actionType: ['peeps'],
						apiOperation: ['listByVybit'],
					},
				},
				default: '',
				description: 'The unique key of the vybit',
			},
			// Subscription Key
			{
				displayName: 'Subscription Key',
				name: 'subscriptionKey',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						actionType: ['subscriptions'],
						apiOperation: ['getPublic', 'subscribe'],
					},
				},
				default: '',
				description: 'The unique key of the subscription',
			},
			// Following Key (for subscription management)
			{
				displayName: 'Following Key',
				name: 'followingKey',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						actionType: ['subscriptions'],
						apiOperation: ['getSubscription', 'updateSubscription', 'unsubscribe', 'sendToOwner', 'sendToGroup'],
					},
				},
				default: '',
				description: 'The unique key of the subscription following',
			},
			// Following Key for logs
			{
				displayName: 'Following Key',
				name: 'followingKey',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						actionType: ['logs'],
						apiOperation: ['listBySubscription'],
					},
				},
				default: '',
				description: 'The unique key of the subscription following',
			},
			// Sound Key
			{
				displayName: 'Sound Key',
				name: 'soundKey',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						actionType: ['sounds'],
						apiOperation: ['get'],
					},
				},
				default: '',
				description: 'The unique key of the sound',
			},
			// Log Key
			{
				displayName: 'Log Key',
				name: 'logKey',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						actionType: ['logs'],
						apiOperation: ['get'],
					},
				},
				default: '',
				description: 'The unique key of the log entry',
			},
			// Peep Key
			{
				displayName: 'Peep Key',
				name: 'peepKey',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						actionType: ['peeps'],
						apiOperation: ['get', 'delete'],
					},
				},
				default: '',
				description: 'The unique key of the peep',
			},

			// ===== LIST/SEARCH OPTIONS =====

			// Options for vybits list
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				displayOptions: {
					show: {
						actionType: ['vybits'],
						apiOperation: ['list'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Search',
						name: 'search',
						type: 'string',
						default: '',
						description: 'Search vybits by name',
					},
					{
						displayName: 'Limit',
						name: 'limit',
						type: 'number',
						default: 30,
						description: 'Max number of results to return',
					},
					{
						displayName: 'Offset',
						name: 'offset',
						type: 'number',
						default: 0,
						description: 'Number of results to skip',
					},
				],
			},
			// Options for sounds search
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				displayOptions: {
					show: {
						actionType: ['sounds'],
						apiOperation: ['search'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Search',
						name: 'search',
						type: 'string',
						default: '',
						description: 'Search sounds by name or description',
					},
					{
						displayName: 'Limit',
						name: 'limit',
						type: 'number',
						default: 30,
						description: 'Max number of results to return',
					},
					{
						displayName: 'Offset',
						name: 'offset',
						type: 'number',
						default: 0,
						description: 'Number of results to skip',
					},
				],
			},
			// Options for subscriptions list public
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				displayOptions: {
					show: {
						actionType: ['subscriptions'],
						apiOperation: ['listPublic', 'listSubscriptions'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Search',
						name: 'search',
						type: 'string',
						default: '',
						description: 'Search by name',
					},
					{
						displayName: 'Limit',
						name: 'limit',
						type: 'number',
						default: 30,
						description: 'Max number of results to return',
					},
					{
						displayName: 'Offset',
						name: 'offset',
						type: 'number',
						default: 0,
						description: 'Number of results to skip',
					},
				],
			},
			// Options for logs list
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				displayOptions: {
					show: {
						actionType: ['logs'],
						apiOperation: ['listAll', 'listByVybit', 'listBySubscription'],
					},
				},
				default: {},
				options: [
				{
					displayName: 'Search',
					name: 'search',
					type: 'string',
					default: '',
					description: 'Search logs by vybit name or diagnostic fields',
				},
					{
						displayName: 'Limit',
						name: 'limit',
						type: 'number',
						default: 30,
						description: 'Max number of results to return',
					},
					{
						displayName: 'Offset',
						name: 'offset',
						type: 'number',
						default: 0,
						description: 'Number of results to skip',
					},
				],
			},
			// Options for peeps list
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				displayOptions: {
					show: {
						actionType: ['peeps'],
						apiOperation: ['listAll', 'listByVybit'],
					},
				},
				default: {},
				options: [
				{
					displayName: 'Search',
					name: 'search',
					type: 'string',
					default: '',
					description: 'Search peeps by name',
				},
					{
						displayName: 'Limit',
						name: 'limit',
						type: 'number',
						default: 30,
						description: 'Max number of results to return',
					},
					{
						displayName: 'Offset',
						name: 'offset',
						type: 'number',
						default: 0,
						description: 'Number of results to skip',
					},
				],
			},
			// Notification parameters (OAuth2)
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				displayOptions: {
					show: {
						actionType: ['notification'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Message',
						name: 'message',
						type: 'string',
						default: '',
						description: 'Optional message to display with notification',
					},
					{
						displayName: 'Image URL',
						name: 'image',
						type: 'string',
						default: '',
						description: 'Optional image URL to attach to notification',
					},
					{
						displayName: 'Link URL',
						name: 'link',
						type: 'string',
						default: '',
						description: 'Optional redirect URL when notification is tapped',
					},
					{
						displayName: 'Log',
						name: 'log',
						type: 'string',
						default: '',
						description: 'Optional content to append to the vybit log',
					},
				],
			},
			// Trigger parameters for Developer API
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				displayOptions: {
					show: {
						actionType: ['vybits'],
						apiOperation: ['trigger'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Message',
						name: 'message',
						type: 'string',
						default: '',
						description: 'Optional message to display with notification',
					},
					{
						displayName: 'Image URL',
						name: 'image',
						type: 'string',
						default: '',
						description: 'Optional image URL to attach to notification',
					},
					{
						displayName: 'Link URL',
						name: 'link',
						type: 'string',
						default: '',
						description: 'Optional redirect URL when notification is tapped',
					},
					{
						displayName: 'Log',
						name: 'log',
						type: 'string',
						default: '',
						description: 'Optional content to append to the vybit log',
					},
				],
			},
			// Create vybit parameters
			{
				displayName: 'Vybit Name',
				name: 'vybitName',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						actionType: ['vybits'],
						apiOperation: ['create'],
					},
				},
				default: '',
				description: 'The name of the vybit to create',
			},
			// Update vybit parameters
			{
				displayName: 'Update Fields',
				name: 'updateFields',
				type: 'collection',
				placeholder: 'Add Field',
				displayOptions: {
					show: {
						actionType: ['vybits'],
						apiOperation: ['update'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						default: '',
						description: 'Vybit display name (max 255 characters)',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: '',
						description: 'Detailed vybit description',
					},
					{
						displayName: 'Sound Key',
						name: 'soundKey',
						type: 'string',
						default: '',
						description: 'Key of the sound to play (must be an available sound)',
					},
					{
						displayName: 'Trigger Type',
						name: 'triggerType',
						type: 'options',
						options: [
							{ name: 'Webhook', value: 'webhook' },
							{ name: 'Schedule', value: 'schedule' },
							{ name: 'Geofence', value: 'geofence' },
							{ name: 'Integration', value: 'integration' },
						],
						default: 'webhook',
						description: 'How this vybit is triggered',
					},
					{
						displayName: 'Access',
						name: 'access',
						type: 'options',
						options: [
							{ name: 'Public', value: 'public' },
							{ name: 'Private', value: 'private' },
							{ name: 'Unlisted', value: 'unlisted' },
						],
						default: 'private',
						description: 'Vybit visibility and access control',
					},
					{
						displayName: 'Status',
						name: 'status',
						type: 'options',
						options: [
							{ name: 'On', value: 'on' },
							{ name: 'Off', value: 'off' },
						],
						default: 'on',
						description: 'Enable or disable the vybit',
					},
					{
						displayName: 'Message',
						name: 'message',
						type: 'string',
						default: '',
						description: 'Default message displayed with notifications (max 500 characters)',
					},
					{
						displayName: 'Image URL',
						name: 'imageUrl',
						type: 'string',
						default: '',
						description: 'Default image URL for notifications',
					},
					{
						displayName: 'Link URL',
						name: 'linkUrl',
						type: 'string',
						default: '',
						description: 'Default URL to open when notification is tapped',
					},
					{
						displayName: 'Send Permissions',
						name: 'sendPermissions',
						type: 'options',
						options: [
							{ name: 'Owner → Subscribers (one-way)', value: 'owner_subs' },
							{ name: 'Owner ↔ Subscribers (two-way)', value: 'subs_owner' },
							{ name: 'Subscribers → Group (group broadcast)', value: 'subs_group' },
						],
						default: 'owner_subs',
						description: 'Who can trigger and receive notifications',
					},
				],
			},
		],
	};

	methods = {
		loadOptions: {
			async getVybits(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				try {
					// Check if credentials are available
					let credentials;
					try {
						credentials = await this.getCredentials('vybitOAuth2Api');
					} catch (error) {
						// Credentials not selected yet
						this.logger.info('No credentials selected', { error: (error as Error).message });
						return [{
							name: 'Please connect your Vybit account first',
							value: '',
							description: 'Click above to create or select a credential',
						}];
					}

					// OAuth2 credentials store the token in oauthTokenData
					const oauthData = (credentials as any)?.oauthTokenData;
					const accessToken = oauthData?.access_token as string;

					this.logger.info('OAuth token data', {
						hasOauthData: !!oauthData,
						hasAccessToken: !!accessToken,
						tokenLength: accessToken?.length,
					});

					// If no access token, user hasn't completed OAuth flow
					if (!accessToken) {
						this.logger.warn('No access token in credentials', {
							credentialKeys: credentials ? Object.keys(credentials) : [],
							oauthDataKeys: oauthData ? Object.keys(oauthData) : [],
						});
						return [{
							name: 'Please complete OAuth connection',
							value: '',
							description: 'Click "Connect my account" to authorize',
						}];
					}

					this.logger.info('Loading vybits...', {
						url: 'https://vybit.net/rest/vybit_list',
						hasToken: !!accessToken,
						tokenLength: accessToken?.length,
					});

					// Use n8n's HTTP request helper
					const response = await this.helpers.httpRequest({
						method: 'GET',
						url: 'https://vybit.net/rest/vybit_list',
						headers: {
							'Authorization': `Bearer ${accessToken}`,
							'Content-Type': 'application/json',
						},
						json: true,
						returnFullResponse: false,
					});

					this.logger.info('Vybit API response received', {
						isArray: Array.isArray(response),
						type: typeof response,
						keys: response ? Object.keys(response).slice(0, 5) : [],
						length: Array.isArray(response) ? response.length : 'N/A',
					});

					// Check if data is an array or wrapped in an object
					const vybits = Array.isArray(response) ? response : (response.vybits || response.data || []);

					this.logger.info('Processed vybits', {
						count: vybits.length,
						firstVybit: vybits[0] ? {
							name: vybits[0].name,
							hasTriggerKey: !!vybits[0].triggerKey,
							keys: Object.keys(vybits[0]),
						} : null,
					});

					if (!Array.isArray(vybits) || vybits.length === 0) {
						return [{
							name: 'No vybits found',
							value: '__no_vybits__',
							description: 'Create a vybit at vybit.net first',
						}];
					}

					return vybits
						.filter((vybit: any) => {
							const key = vybit.triggerKey || vybit.trigger_key || vybit.key;
							return key && key.length > 0;
						})
						.map((vybit: any) => ({
							name: vybit.name || vybit.title || 'Unnamed Vybit',
							value: vybit.triggerKey || vybit.trigger_key || vybit.key,
							description: vybit.description || undefined,
						}));
				} catch (error: any) {
					this.logger.error('Error in getVybits', {
						message: error.message,
						stack: error.stack,
						name: error.name,
					});

					// Provide helpful error messages
					if (error.message?.includes('401')) {
						return [{
							name: 'Authorization failed - please reconnect',
							value: '',
							description: 'Your token may have expired',
						}];
					}

					throw new Error(`Failed to load vybits: ${error.message}`);
				}
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const actionType = this.getNodeParameter('actionType', 0) as string;

		let client: VybitAPIClient | undefined;

		// Initialize API client only for Developer API operations
		if (actionType !== 'notification') {
			const credentials = await this.getCredentials('vybitApi');
			client = new VybitAPIClient({
				apiKey: credentials.apiKey as string,
				baseURL: credentials.baseUrl as string,
			});
		}

		// Process each input item
		for (let i = 0; i < items.length; i++) {
			try {
				if (actionType === 'notification') {
					// OAuth2 notification - direct HTTP request
					const credentials = await this.getCredentials('vybitOAuth2Api');
					const oauthData = (credentials as any)?.oauthTokenData;
					const accessToken = oauthData?.access_token as string;

					const triggerKey = this.getNodeParameter('triggerKey', i) as string;
					const additionalFields = this.getNodeParameter('additionalFields', i, {}) as any;

					// Build request body with only provided fields
					const body: any = {};
					if (additionalFields.message) body.message = additionalFields.message;
					if (additionalFields.image) body.imageUrl = additionalFields.image;
					if (additionalFields.link) body.linkUrl = additionalFields.link;
					if (additionalFields.log !== undefined) body.log = additionalFields.log;

					// Make direct HTTP request to trigger the vybit
					const result = await this.helpers.httpRequest({
						method: 'POST',
						url: `https://vybit.net/fire/${triggerKey}`,
						headers: {
							'Authorization': `Bearer ${accessToken}`,
							'Content-Type': 'application/json',
						},
						body,
						json: true,
					});

					returnData.push({ json: result });
				} else if (actionType === 'profile') {
					const apiOperation = this.getNodeParameter('apiOperation', i) as string;

					if (apiOperation === 'getProfile') {
						const profile = await (client as VybitAPIClient).getProfile();
						returnData.push({ json: profile });
					} else if (apiOperation === 'getMeter') {
						const meter = await (client as VybitAPIClient).getMeter();
						returnData.push({ json: meter });
					} else if (apiOperation === 'getStatus') {
						const status = await (client as VybitAPIClient).getStatus();
						returnData.push({ json: status });
					}
				} else if (actionType === 'vybits') {
					const apiOperation = this.getNodeParameter('apiOperation', i) as string;

					if (apiOperation === 'list') {
						const options = this.getNodeParameter('options', i, {}) as any;
						const vybits = await (client as VybitAPIClient).listVybits({
							search: options.search,
							limit: options.limit,
							offset: options.offset,
						});
						returnData.push({ json: vybits });
					} else if (apiOperation === 'get') {
						const vybitKey = this.getNodeParameter('vybitKey', i) as string;
						const vybit = await (client as VybitAPIClient).getVybit(vybitKey);
						returnData.push({ json: vybit });
					} else if (apiOperation === 'create') {
						const name = this.getNodeParameter('vybitName', i) as string;
						const vybit = await (client as VybitAPIClient).createVybit({ name });
						returnData.push({ json: vybit });
					} else if (apiOperation === 'update') {
						const vybitKey = this.getNodeParameter('vybitKey', i) as string;
						const updateFields = this.getNodeParameter('updateFields', i, {}) as any;
						const vybit = await (client as VybitAPIClient).updateVybit(vybitKey, updateFields);
						returnData.push({ json: vybit });
					} else if (apiOperation === 'delete') {
						const vybitKey = this.getNodeParameter('vybitKey', i) as string;
						await (client as VybitAPIClient).deleteVybit(vybitKey);
						returnData.push({ json: { success: true, vybitKey } });
					} else if (apiOperation === 'trigger') {
						const vybitKey = this.getNodeParameter('vybitKey', i) as string;
						const additionalFields = this.getNodeParameter('additionalFields', i, {}) as any;
						const result = await (client as VybitAPIClient).triggerVybit(vybitKey, {
							message: additionalFields.message,
							image: additionalFields.image,
							link: additionalFields.link,
							log: additionalFields.log,
						});
						returnData.push({ json: result });
					}
				} else if (actionType === 'subscriptions') {
					const apiOperation = this.getNodeParameter('apiOperation', i) as string;

					if (apiOperation === 'listPublic') {
						const options = this.getNodeParameter('options', i, {}) as any;
						const vybits = await (client as VybitAPIClient).listPublicSubscriptions({
							search: options.search,
							limit: options.limit,
							offset: options.offset,
						});
						returnData.push({ json: vybits });
					} else if (apiOperation === 'getPublic') {
						const subscriptionKey = this.getNodeParameter('subscriptionKey', i) as string;
						const vybit = await (client as VybitAPIClient).getPublicSubscription(subscriptionKey);
						returnData.push({ json: vybit });
					} else if (apiOperation === 'subscribe') {
						const subscriptionKey = this.getNodeParameter('subscriptionKey', i) as string;
						const result = await (client as VybitAPIClient).subscribe(subscriptionKey);
						returnData.push({ json: result });
					} else if (apiOperation === 'listSubscriptions') {
						const options = this.getNodeParameter('options', i, {}) as any;
						const subscriptions = await (client as VybitAPIClient).listSubscriptions({
							search: options.search,
							limit: options.limit,
							offset: options.offset,
						});
						returnData.push({ json: subscriptions });
					} else if (apiOperation === 'getSubscription') {
						const followingKey = this.getNodeParameter('followingKey', i) as string;
						const subscription = await (client as VybitAPIClient).getSubscription(followingKey);
						returnData.push({ json: subscription });
					} else if (apiOperation === 'updateSubscription') {
						const followingKey = this.getNodeParameter('followingKey', i) as string;
						const updateFields = this.getNodeParameter('updateFields', i, {}) as any;
						const subscription = await (client as VybitAPIClient).updateSubscription(followingKey, updateFields);
						returnData.push({ json: subscription });
					} else if (apiOperation === 'unsubscribe') {
						const followingKey = this.getNodeParameter('followingKey', i) as string;
						await (client as VybitAPIClient).unsubscribe(followingKey);
						returnData.push({ json: { success: true, followingKey } });
					} else if (apiOperation === 'sendToOwner') {
						const followingKey = this.getNodeParameter('followingKey', i) as string;
						const additionalFields = this.getNodeParameter('additionalFields', i, {}) as any;
						const result = await (client as VybitAPIClient).sendToOwner(followingKey, {
							message: additionalFields.message,
						});
						returnData.push({ json: result });
					} else if (apiOperation === 'sendToGroup') {
						const followingKey = this.getNodeParameter('followingKey', i) as string;
						const additionalFields = this.getNodeParameter('additionalFields', i, {}) as any;
						const result = await (client as VybitAPIClient).sendToGroup(followingKey, {
							message: additionalFields.message,
						});
						returnData.push({ json: result });
					}
				} else if (actionType === 'sounds') {
					const apiOperation = this.getNodeParameter('apiOperation', i) as string;

					if (apiOperation === 'search') {
						const options = this.getNodeParameter('options', i, {}) as any;
						const sounds = await (client as VybitAPIClient).searchSounds({
							search: options.search,
							limit: options.limit,
							offset: options.offset,
						});
						returnData.push({ json: sounds });
					} else if (apiOperation === 'get') {
						const soundKey = this.getNodeParameter('soundKey', i) as string;
						const sound = await (client as VybitAPIClient).getSound(soundKey);
						returnData.push({ json: sound });
					}
				} else if (actionType === 'logs') {
					const apiOperation = this.getNodeParameter('apiOperation', i) as string;

					if (apiOperation === 'listAll') {
						const options = this.getNodeParameter('options', i, {}) as any;
						const logs = await (client as VybitAPIClient).listLogs({
						search: options.search,
							limit: options.limit,
							offset: options.offset,
						});
						returnData.push({ json: logs });
					} else if (apiOperation === 'get') {
						const logKey = this.getNodeParameter('logKey', i) as string;
						const log = await (client as VybitAPIClient).getLog(logKey);
						returnData.push({ json: log });
					} else if (apiOperation === 'listByVybit') {
						const vybitKey = this.getNodeParameter('vybitKey', i) as string;
						const options = this.getNodeParameter('options', i, {}) as any;
						const logs = await (client as VybitAPIClient).listLogsByVybit(vybitKey, {
						search: options.search,
							limit: options.limit,
							offset: options.offset,
						});
						returnData.push({ json: logs });
					} else if (apiOperation === 'listBySubscription') {
						const followingKey = this.getNodeParameter('followingKey', i) as string;
						const options = this.getNodeParameter('options', i, {}) as any;
						const logs = await (client as VybitAPIClient).listLogsBySubscription(followingKey, {
						search: options.search,
							limit: options.limit,
							offset: options.offset,
						});
						returnData.push({ json: logs });
					}
				} else if (actionType === 'peeps') {
					const apiOperation = this.getNodeParameter('apiOperation', i) as string;

					if (apiOperation === 'listAll') {
						const options = this.getNodeParameter('options', i, {}) as any;
						const peeps = await (client as VybitAPIClient).listPeeps({
						search: options.search,
							limit: options.limit,
							offset: options.offset,
						});
						returnData.push({ json: peeps });
					} else if (apiOperation === 'listByVybit') {
						const vybitKey = this.getNodeParameter('vybitKey', i) as string;
						const options = this.getNodeParameter('options', i, {}) as any;
						const peeps = await (client as VybitAPIClient).listPeepsByVybit(vybitKey, {
						search: options.search,
							limit: options.limit,
							offset: options.offset,
						});
						returnData.push({ json: peeps });
					} else if (apiOperation === 'create') {
						const peepKey = this.getNodeParameter('peepKey', i) as string;
						const result = await (client as VybitAPIClient).createPeep(peepKey);
						returnData.push({ json: result });
					} else if (apiOperation === 'get') {
						const peepKey = this.getNodeParameter('peepKey', i) as string;
						const peep = await (client as VybitAPIClient).getPeep(peepKey);
						returnData.push({ json: peep });
					} else if (apiOperation === 'delete') {
						const peepKey = this.getNodeParameter('peepKey', i) as string;
						await (client as VybitAPIClient).deletePeep(peepKey);
						returnData.push({ json: { success: true, peepKey } });
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
