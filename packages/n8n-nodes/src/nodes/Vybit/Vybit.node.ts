import type {
	IExecuteFunctions,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';

import { NodeApiError, NodeConnectionTypes } from 'n8n-workflow';

const VYBIT_BASE_URL = 'https://api.vybit.net/v1';

function buildSearchQs(options: any): Record<string, string | number> {
	const qs: Record<string, string | number> = {};
	if (options.search) qs.search = options.search;
	if (options.limit !== undefined) qs.limit = options.limit;
	if (options.offset !== undefined) qs.offset = options.offset;
	return qs;
}

function pickDefined(obj: any, keys: string[]): Record<string, any> {
	const result: Record<string, any> = {};
	for (const key of keys) {
		if (obj[key] !== undefined && obj[key] !== '') result[key] = obj[key];
	}
	return result;
}

async function vybitApiRequest(
	context: IExecuteFunctions | ILoadOptionsFunctions,
	credentialType: string,
	method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
	endpoint: string,
	body?: object,
	qs?: Record<string, string | number>,
): Promise<any> {
	let baseUrl = VYBIT_BASE_URL;
	if (credentialType === 'vybitApi') {
		const creds = await context.getCredentials('vybitApi');
		if (creds.baseUrl) baseUrl = creds.baseUrl as string;
	}
	const options: IHttpRequestOptions = {
		method,
		url: `${baseUrl}${endpoint}`,
		json: true,
	};
	if (body && Object.keys(body).length > 0) {
		options.body = body;
	}
	if (qs && Object.keys(qs).length > 0) {
		options.qs = qs as any;
	}
	return context.helpers.httpRequestWithAuthentication.call(
		context, credentialType, options,
	);
}

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
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		codex: {
			categories: ['Communication'],
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
						description: 'Connect your Vybit account via OAuth2',
					},
					{
						name: 'API Key',
						value: 'apiKey',
						description: 'Developer API key',
					},
				],
				default: 'oAuth2',
			},
			// Resource selector - sorted alphabetically
			{
				displayName: 'Resource',
				name: 'actionType',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Logs',
						value: 'logs',
						description: 'View notification logs',
						action: 'View logs',
					},
					{
						name: 'Peeps',
						value: 'peeps',
						description: 'Manage vybit invitations',
						action: 'Manage peeps',
					},
					{
						name: 'Profile',
						value: 'profile',
						description: 'View profile and usage metrics',
						action: 'View profile',
					},
					{
						name: 'Reminders',
						value: 'reminders',
						description: 'Manage scheduled reminders on vybits',
						action: 'Manage reminders',
					},
					{
						name: 'Sounds',
						value: 'sounds',
						description: 'Search and manage sounds',
						action: 'Manage sounds',
					},
					{
						name: 'Subscriptions',
						value: 'subscriptions',
						description: 'Manage vybit subscriptions',
						action: 'Manage subscriptions',
					},
					{
						name: 'Vybits',
						value: 'vybits',
						description: 'Manage vybits (custom notifications)',
						action: 'Manage vybits',
					},
				],
				default: 'vybits',
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
			// ===== REMINDERS OPERATIONS =====
			{
				displayName: 'Operation',
				name: 'apiOperation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						actionType: ['reminders'],
					},
				},
				options: [
					{
						name: 'List',
						value: 'list',
						description: 'List all reminders on a vybit',
					},
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new scheduled reminder',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update an existing reminder',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a reminder',
					},
				],
				default: 'list',
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
			// Vybit Key for peeps (listByVybit and create/invite)
			{
				displayName: 'Vybit Key',
				name: 'vybitKey',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						actionType: ['peeps'],
						apiOperation: ['listByVybit', 'create'],
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
			// Peep Key (for get and delete)
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
			// Email for peep invite
			{
				displayName: 'Email',
				name: 'peepEmail',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						actionType: ['peeps'],
						apiOperation: ['create'],
					},
				},
				default: '',
				description: 'Email address of the user to invite',
			},

			// Vybit Key for reminders (all operations need it)
			{
				displayName: 'Vybit Key',
				name: 'vybitKey',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						actionType: ['reminders'],
					},
				},
				default: '',
				description: 'The unique key of the vybit',
			},
			// Reminder ID (for update and delete)
			{
				displayName: 'Reminder ID',
				name: 'reminderId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						actionType: ['reminders'],
						apiOperation: ['update', 'delete'],
					},
				},
				default: '',
				description: 'The unique ID of the reminder',
			},
			// Cron expression (required for create)
			{
				displayName: 'Cron Expression',
				name: 'cron',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						actionType: ['reminders'],
						apiOperation: ['create'],
					},
				},
				default: '',
				description: "Cron expression: minute hour day month dayOfWeek. Example: '0 9 * * *' = every day at 9:00 AM",
			},
			// Optional fields for reminder create/update
			{
				displayName: 'Optional Fields',
				name: 'optionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				displayOptions: {
					show: {
						actionType: ['reminders'],
						apiOperation: ['create', 'update'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Cron Expression',
						name: 'cron',
						type: 'string',
						default: '',
						description: "Updated cron expression (for update only). Example: '0 9 * * *' = every day at 9:00 AM",
					},
					{
						displayName: 'Time Zone',
						name: 'timeZone',
						type: 'string',
						default: '',
						description: 'IANA timezone identifier (e.g. America/New_York). Defaults to UTC',
					},
					{
						displayName: 'Message',
						name: 'message',
						type: 'string',
						default: '',
						description: 'Message to display with the reminder notification (max 256 characters)',
					},
					{
						displayName: 'Image URL',
						name: 'imageUrl',
						type: 'string',
						default: '',
						description: 'Image URL to attach to the reminder notification (must be a direct link to a JPG, PNG, or GIF image, max 512 characters)',
					},
					{
						displayName: 'Link URL',
						name: 'linkUrl',
						type: 'string',
						default: '',
						description: 'URL to open when the reminder notification is tapped (max 512 characters, must be a valid URL)',
					},
					{
						displayName: 'Log',
						name: 'log',
						type: 'string',
						default: '',
						description: 'Content to append to the vybit log (max 1024 characters)',
					},
				],
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
			// Trigger parameters
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
						description: 'Optional image URL to attach to notification (must be a direct link to a JPG, PNG, or GIF image)',
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
			// Additional fields for sendToOwner/sendToGroup
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				displayOptions: {
					show: {
						actionType: ['subscriptions'],
						apiOperation: ['sendToOwner', 'sendToGroup'],
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
						name: 'imageUrl',
						type: 'string',
						default: '',
						description: 'Optional image URL to attach to notification (must be a direct link to a JPG, PNG, or GIF image)',
					},
					{
						displayName: 'Link URL',
						name: 'linkUrl',
						type: 'string',
						default: '',
						description: 'Optional redirect URL when notification is tapped',
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
							{ name: 'Reminders', value: 'reminders' },
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
						description: 'Default image URL for notifications (must be a direct link to a JPG, PNG, or GIF image)',
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
					const authType = this.getNodeParameter('authentication', 0) as string;
					const credentialType = authType === 'oAuth2' ? 'vybitOAuth2Api' : 'vybitApi';

					let vybits;
					try {
						vybits = await vybitApiRequest(this, credentialType, 'GET', '/vybits');
					} catch (error) {
						return [{
							name: 'Please connect your Vybit account first',
							value: '',
							description: 'Click above to create or select a credential',
						}];
					}

					if (!Array.isArray(vybits) || vybits.length === 0) {
						return [{
							name: 'No vybits found',
							value: '__no_vybits__',
							description: 'Create a vybit at vybit.net first',
						}];
					}

					return vybits
						.filter((vybit: any) => {
							const key = vybit.triggerKey || vybit.key;
							return key && key.length > 0;
						})
						.map((vybit: any) => ({
							name: vybit.name || 'Unnamed Vybit',
							value: vybit.triggerKey || vybit.key,
							description: vybit.description || undefined,
						}));
				} catch (error: any) {
					if (error.message?.includes('401')) {
						return [{
							name: 'Authorization failed - please reconnect',
							value: '',
							description: 'Your credentials may have expired',
						}];
					}

					throw new NodeApiError(this.getNode(), error as JsonObject);
				}
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const actionType = this.getNodeParameter('actionType', 0) as string;
		const authType = this.getNodeParameter('authentication', 0) as string;
		const credentialType = authType === 'oAuth2' ? 'vybitOAuth2Api' : 'vybitApi';

		for (let i = 0; i < items.length; i++) {
			try {
				if (actionType === 'profile') {
					const apiOperation = this.getNodeParameter('apiOperation', i) as string;

					if (apiOperation === 'getProfile') {
						const result = await vybitApiRequest(this, credentialType, 'GET', '/profile');
						returnData.push({ json: result, pairedItem: { item: i } });
					} else if (apiOperation === 'getMeter') {
						const result = await vybitApiRequest(this, credentialType, 'GET', '/meter');
						returnData.push({ json: result, pairedItem: { item: i } });
					} else if (apiOperation === 'getStatus') {
						const result = await vybitApiRequest(this, credentialType, 'GET', '/status');
						returnData.push({ json: result, pairedItem: { item: i } });
					}
				} else if (actionType === 'vybits') {
					const apiOperation = this.getNodeParameter('apiOperation', i) as string;

					if (apiOperation === 'list') {
						const qs = buildSearchQs(this.getNodeParameter('options', i, {}));
						const result = await vybitApiRequest(this, credentialType, 'GET', '/vybits', undefined, qs);
						returnData.push({ json: result, pairedItem: { item: i } });
					} else if (apiOperation === 'get') {
						const vybitKey = this.getNodeParameter('vybitKey', i) as string;
						const result = await vybitApiRequest(this, credentialType, 'GET', `/vybit/${vybitKey}`);
						returnData.push({ json: result, pairedItem: { item: i } });
					} else if (apiOperation === 'create') {
						const name = this.getNodeParameter('vybitName', i) as string;
						const result = await vybitApiRequest(this, credentialType, 'POST', '/vybit', { name });
						returnData.push({ json: result, pairedItem: { item: i } });
					} else if (apiOperation === 'update') {
						const vybitKey = this.getNodeParameter('vybitKey', i) as string;
						const updateFields = this.getNodeParameter('updateFields', i, {}) as any;
						const result = await vybitApiRequest(this, credentialType, 'PUT', `/vybit/${vybitKey}`, updateFields);
						returnData.push({ json: result, pairedItem: { item: i } });
					} else if (apiOperation === 'delete') {
						const vybitKey = this.getNodeParameter('vybitKey', i) as string;
						await vybitApiRequest(this, credentialType, 'DELETE', `/vybit/${vybitKey}`);
						returnData.push({ json: { success: true, vybitKey }, pairedItem: { item: i } });
					} else if (apiOperation === 'trigger') {
						const vybitKey = this.getNodeParameter('vybitKey', i) as string;
						const body = pickDefined(this.getNodeParameter('additionalFields', i, {}), ['message', 'image', 'link', 'log']);
						const result = await vybitApiRequest(this, credentialType, 'POST', `/vybit/${vybitKey}/trigger`, body);
						returnData.push({ json: result, pairedItem: { item: i } });
					}
				} else if (actionType === 'subscriptions') {
					const apiOperation = this.getNodeParameter('apiOperation', i) as string;

					if (apiOperation === 'listPublic') {
						const qs = buildSearchQs(this.getNodeParameter('options', i, {}));
						const result = await vybitApiRequest(this, credentialType, 'GET', '/subscriptions/public', undefined, qs);
						returnData.push({ json: result, pairedItem: { item: i } });
					} else if (apiOperation === 'getPublic') {
						const subscriptionKey = this.getNodeParameter('subscriptionKey', i) as string;
						const result = await vybitApiRequest(this, credentialType, 'GET', `/subscription/${subscriptionKey}`);
						returnData.push({ json: result, pairedItem: { item: i } });
					} else if (apiOperation === 'subscribe') {
						const subscriptionKey = this.getNodeParameter('subscriptionKey', i) as string;
						const result = await vybitApiRequest(this, credentialType, 'POST', `/subscription/${subscriptionKey}`);
						returnData.push({ json: result, pairedItem: { item: i } });
					} else if (apiOperation === 'listSubscriptions') {
						const qs = buildSearchQs(this.getNodeParameter('options', i, {}));
						const result = await vybitApiRequest(this, credentialType, 'GET', '/subscriptions/following', undefined, qs);
						returnData.push({ json: result, pairedItem: { item: i } });
					} else if (apiOperation === 'getSubscription') {
						const followingKey = this.getNodeParameter('followingKey', i) as string;
						const result = await vybitApiRequest(this, credentialType, 'GET', `/subscription/following/${followingKey}`);
						returnData.push({ json: result, pairedItem: { item: i } });
					} else if (apiOperation === 'updateSubscription') {
						const followingKey = this.getNodeParameter('followingKey', i) as string;
						const updateFields = this.getNodeParameter('updateFields', i, {}) as any;
						const result = await vybitApiRequest(this, credentialType, 'PATCH', `/subscription/following/${followingKey}`, updateFields);
						returnData.push({ json: result, pairedItem: { item: i } });
					} else if (apiOperation === 'unsubscribe') {
						const followingKey = this.getNodeParameter('followingKey', i) as string;
						await vybitApiRequest(this, credentialType, 'DELETE', `/subscription/following/${followingKey}`);
						returnData.push({ json: { success: true, followingKey }, pairedItem: { item: i } });
					} else if (apiOperation === 'sendToOwner' || apiOperation === 'sendToGroup') {
						const followingKey = this.getNodeParameter('followingKey', i) as string;
						const body = pickDefined(this.getNodeParameter('additionalFields', i, {}), ['message', 'imageUrl', 'linkUrl']);
						const action = apiOperation === 'sendToOwner' ? 'send-to-owner' : 'send-to-group';
						const result = await vybitApiRequest(this, credentialType, 'POST', `/subscription/following/${followingKey}/${action}`, body);
						returnData.push({ json: result, pairedItem: { item: i } });
					}
				} else if (actionType === 'sounds') {
					const apiOperation = this.getNodeParameter('apiOperation', i) as string;

					if (apiOperation === 'search') {
						const qs = buildSearchQs(this.getNodeParameter('options', i, {}));
						const result = await vybitApiRequest(this, credentialType, 'GET', '/sounds', undefined, qs);
						returnData.push({ json: result, pairedItem: { item: i } });
					} else if (apiOperation === 'get') {
						const soundKey = this.getNodeParameter('soundKey', i) as string;
						const result = await vybitApiRequest(this, credentialType, 'GET', `/sound/${soundKey}`);
						returnData.push({ json: result, pairedItem: { item: i } });
					}
				} else if (actionType === 'logs') {
					const apiOperation = this.getNodeParameter('apiOperation', i) as string;

					if (apiOperation === 'listAll') {
						const qs = buildSearchQs(this.getNodeParameter('options', i, {}));
						const result = await vybitApiRequest(this, credentialType, 'GET', '/logs', undefined, qs);
						returnData.push({ json: result, pairedItem: { item: i } });
					} else if (apiOperation === 'get') {
						const logKey = this.getNodeParameter('logKey', i) as string;
						const result = await vybitApiRequest(this, credentialType, 'GET', `/log/${logKey}`);
						returnData.push({ json: result, pairedItem: { item: i } });
					} else if (apiOperation === 'listByVybit') {
						const vybitKey = this.getNodeParameter('vybitKey', i) as string;
						const qs = buildSearchQs(this.getNodeParameter('options', i, {}));
						const result = await vybitApiRequest(this, credentialType, 'GET', `/logs/vybit/${vybitKey}`, undefined, qs);
						returnData.push({ json: result, pairedItem: { item: i } });
					} else if (apiOperation === 'listBySubscription') {
						const followingKey = this.getNodeParameter('followingKey', i) as string;
						const qs = buildSearchQs(this.getNodeParameter('options', i, {}));
						const result = await vybitApiRequest(this, credentialType, 'GET', `/logs/subscription/following/${followingKey}`, undefined, qs);
						returnData.push({ json: result, pairedItem: { item: i } });
					}
				} else if (actionType === 'peeps') {
					const apiOperation = this.getNodeParameter('apiOperation', i) as string;

					if (apiOperation === 'listAll') {
						const qs = buildSearchQs(this.getNodeParameter('options', i, {}));
						const result = await vybitApiRequest(this, credentialType, 'GET', '/peeps', undefined, qs);
						returnData.push({ json: result, pairedItem: { item: i } });
					} else if (apiOperation === 'listByVybit') {
						const vybitKey = this.getNodeParameter('vybitKey', i) as string;
						const qs = buildSearchQs(this.getNodeParameter('options', i, {}));
						const result = await vybitApiRequest(this, credentialType, 'GET', `/peeps/${vybitKey}`, undefined, qs);
						returnData.push({ json: result, pairedItem: { item: i } });
					} else if (apiOperation === 'create') {
						const vybitKey = this.getNodeParameter('vybitKey', i) as string;
						const email = this.getNodeParameter('peepEmail', i) as string;
						const result = await vybitApiRequest(this, credentialType, 'POST', `/peep/${vybitKey}`, { email });
						returnData.push({ json: result, pairedItem: { item: i } });
					} else if (apiOperation === 'get') {
						const peepKey = this.getNodeParameter('peepKey', i) as string;
						const result = await vybitApiRequest(this, credentialType, 'GET', `/peep/${peepKey}`);
						returnData.push({ json: result, pairedItem: { item: i } });
					} else if (apiOperation === 'delete') {
						const peepKey = this.getNodeParameter('peepKey', i) as string;
						await vybitApiRequest(this, credentialType, 'DELETE', `/peep/${peepKey}`);
						returnData.push({ json: { success: true, peepKey }, pairedItem: { item: i } });
					}
				} else if (actionType === 'reminders') {
					const apiOperation = this.getNodeParameter('apiOperation', i) as string;
					const vybitKey = this.getNodeParameter('vybitKey', i) as string;

					if (apiOperation === 'list') {
						const result = await vybitApiRequest(this, credentialType, 'GET', `/vybit/${vybitKey}/reminders`);
						returnData.push({ json: result, pairedItem: { item: i } });
					} else if (apiOperation === 'create') {
						const cron = this.getNodeParameter('cron', i) as string;
						const body = { cron, ...pickDefined(this.getNodeParameter('optionalFields', i, {}), ['timeZone', 'message', 'imageUrl', 'linkUrl', 'log']) };
						const result = await vybitApiRequest(this, credentialType, 'POST', `/vybit/${vybitKey}/reminders`, body);
						returnData.push({ json: result, pairedItem: { item: i } });
					} else if (apiOperation === 'update') {
						const reminderId = this.getNodeParameter('reminderId', i) as string;
						const body = pickDefined(this.getNodeParameter('optionalFields', i, {}), ['cron', 'timeZone', 'message', 'imageUrl', 'linkUrl', 'log']);
						const result = await vybitApiRequest(this, credentialType, 'PATCH', `/vybit/${vybitKey}/reminders/${reminderId}`, body);
						returnData.push({ json: result, pairedItem: { item: i } });
					} else if (apiOperation === 'delete') {
						const reminderId = this.getNodeParameter('reminderId', i) as string;
						await vybitApiRequest(this, credentialType, 'DELETE', `/vybit/${vybitKey}/reminders/${reminderId}`);
						returnData.push({ json: { success: true, vybitKey, reminderId }, pairedItem: { item: i } });
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
					continue;
				}
				throw new NodeApiError(this.getNode(), error as JsonObject);
			}
		}

		return [returnData];
	}
}
