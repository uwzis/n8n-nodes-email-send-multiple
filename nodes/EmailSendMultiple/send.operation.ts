import type {
	IDataObject,
	IDisplayOptions,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

import { createTransport } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

import { merge } from 'lodash';

import { CREDENTIALS_NAME, EmailSendMultipleCredentialsData } from '../../credentials/EmailSendMultipleCredentials.credentials';

export function updateDisplayOptions(
	displayOptions: IDisplayOptions,
	properties: INodeProperties[],
) {
	return properties.map((nodeProperty) => {
		return {
			...nodeProperty,
			displayOptions: merge({}, nodeProperty.displayOptions, displayOptions),
		};
	});
}

const properties: INodeProperties[] = [
	// TODO: Add choice for text as text or html  (maybe also from name)
	{
		displayName: 'User',
		name: 'user',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'value11',
		description:
			'Name value to map from Credential',
	},
	{
		displayName: 'From Email',
		name: 'fromEmail',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'admin@example.com',
		description:
			'Email address of the sender. You can also specify a name: Nathan Doe &lt;nate@n8n.io&gt;.',
	},
	{
		displayName: 'To Email',
		name: 'toEmail',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'info@example.com',
		description:
			'Email address of the recipient. You can also specify a name: Nathan Doe &lt;nate@n8n.io&gt;.',
	},

	{
		displayName: 'Subject',
		name: 'subject',
		type: 'string',
		default: '',
		placeholder: 'My subject line',
		description: 'Subject line of the email',
	},
	{
		displayName: 'Email Format',
		name: 'emailFormat',
		type: 'options',
		options: [
			{
				name: 'Text',
				value: 'text',
				description: 'Send email as plain text',
			},
			{
				name: 'HTML',
				value: 'html',
				description: 'Send email as HTML',
			},
			{
				name: 'Both',
				value: 'both',
				description: "Send both formats, recipient's client selects version to display",
			},
		],
		default: 'html',
		displayOptions: {
			hide: {
				'@version': [2],
			},
		},
	},
	{
		displayName: 'Email Format',
		name: 'emailFormat',
		type: 'options',
		options: [
			{
				name: 'Text',
				value: 'text',
			},
			{
				name: 'HTML',
				value: 'html',
			},
			{
				name: 'Both',
				value: 'both',
			},
		],
		default: 'text',
		displayOptions: {
			show: {
				'@version': [2],
			},
		},
	},
	{
		displayName: 'Text',
		name: 'text',
		type: 'string',
		typeOptions: {
			rows: 5,
		},
		default: '',
		description: 'Plain text message of email',
		displayOptions: {
			show: {
				emailFormat: ['text', 'both'],
			},
		},
	},
	{
		displayName: 'HTML',
		name: 'html',
		type: 'string',
		typeOptions: {
			rows: 5,
		},
		default: '',
		description: 'HTML text message of email',
		displayOptions: {
			show: {
				emailFormat: ['html', 'both'],
			},
		},
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		options: [
			{
				// eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased
				displayName: 'Append n8n Attribution',
				name: 'appendAttribution',
				type: 'boolean',
				default: true,
				description:
					'Whether to include the phrase “This email was sent automatically with n8n” to the end of the email',
			},
			{
				displayName: 'Attachments',
				name: 'attachments',
				type: 'string',
				default: '',
				description:
					'Name of the binary properties that contain data to add to email as attachment. Multiple ones can be comma-separated. Reference embedded images or other content within the body of an email message, e.g. &lt;img src="cid:image_1"&gt;',
			},
			{
				displayName: 'CC Email',
				name: 'ccEmail',
				type: 'string',
				default: '',
				placeholder: 'cc@example.com',
				description: 'Email address of CC recipient',
			},
			{
				displayName: 'BCC Email',
				name: 'bccEmail',
				type: 'string',
				default: '',
				placeholder: 'bcc@example.com',
				description: 'Email address of BCC recipient',
			},
			{
				displayName: 'Ignore SSL Issues',
				name: 'allowUnauthorizedCerts',
				type: 'boolean',
				default: false,
				description: 'Whether to connect even if SSL certificate validation is not possible',
			},
			{
				displayName: 'Reply To',
				name: 'replyTo',
				type: 'string',
				default: '',
				placeholder: 'info@example.com',
				description: 'The email address to send the reply to',
			},
		],
	},
];

const displayOptions = {
	show: {
		resource: ['email'],
		operation: ['send'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

type EmailSendOptions = {
	appendAttribution?: boolean;
	allowUnauthorizedCerts?: boolean;
	attachments?: string;
	ccEmail?: string;
	bccEmail?: string;
	replyTo?: string;
};

function parseAccount(account: string): any {
	const accountSettings = {} as any;
	account.split(';').forEach((setting) => {
		let [name, value] = setting.split('=').map((part) => part.trim());
		name = name?.toLowerCase();
		accountSettings[name] = value;
	});
	return accountSettings;
}

function configureTransport(credentials: EmailSendMultipleCredentialsData, options: EmailSendOptions, user: string) {
	let userCredentials = {} as any;
	const emailSendMultiple = {} as any;
	credentials.emailSendMultiple.split('\n').forEach((account) => {
		const accountSettings = parseAccount(account);
		if (accountSettings?.name) {
			emailSendMultiple[accountSettings.name] = accountSettings;
			if (accountSettings.name === user) {
				userCredentials = accountSettings;
			}
		}
	});

	if (!userCredentials) {
		userCredentials = parseAccount(user);
	}

	const connectionOptions: SMTPTransport.Options = {
		host: userCredentials.host as string,
		port: userCredentials.port as number,
		secure: userCredentials.secure as boolean,
	};

	if (typeof userCredentials.hostName === 'string' && userCredentials.hostName) {
		connectionOptions.name = userCredentials.hostName;
	}

	if (userCredentials.user || userCredentials.password) {
		connectionOptions.auth = {
			user: userCredentials.user as string,
			pass: userCredentials.password as string,
		};
	}

	if (options.allowUnauthorizedCerts === true) {
		connectionOptions.tls = {
			rejectUnauthorized: false,
		};
	}

	return createTransport(connectionOptions);
}

export async function execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
	const items = this.getInputData();
	const nodeVersion = this.getNode().typeVersion;
	const instanceId = this.getInstanceId();

	const returnData: INodeExecutionData[] = [];
	let item: INodeExecutionData;

	for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
		try {
			item = items[itemIndex];

			const user = this.getNodeParameter('user', itemIndex) as string;
			const fromEmail = this.getNodeParameter('fromEmail', itemIndex) as string;
			const toEmail = this.getNodeParameter('toEmail', itemIndex) as string;
			const subject = this.getNodeParameter('subject', itemIndex) as string;
			const emailFormat = this.getNodeParameter('emailFormat', itemIndex) as string;
			const options = this.getNodeParameter('options', itemIndex, {}) as EmailSendOptions;

			const credentials = await this.getCredentials(CREDENTIALS_NAME) as unknown as EmailSendMultipleCredentialsData;

			const transporter = configureTransport(credentials, options, user);

			const mailOptions: IDataObject = {
				from: fromEmail,
				to: toEmail,
				cc: options.ccEmail,
				bcc: options.bccEmail,
				subject,
				replyTo: options.replyTo,
			};

			if (emailFormat === 'text' || emailFormat === 'both') {
				mailOptions.text = this.getNodeParameter('text', itemIndex, '');
			}

			if (emailFormat === 'html' || emailFormat === 'both') {
				mailOptions.html = this.getNodeParameter('html', itemIndex, '');
			}

			let appendAttribution = options.appendAttribution;
			if (appendAttribution === undefined) {
				appendAttribution = nodeVersion >= 2.1;
			}

			if (appendAttribution) {
				const attributionText = 'This email was sent automatically with ';
				const link = `https://n8n.io/?utm_source=n8n-internal&utm_medium=powered_by&utm_campaign=${encodeURIComponent(
					'n8n-nodes-base.emailSend',
				)}${instanceId ? '_' + instanceId : ''}`;
				if (emailFormat === 'html' || (emailFormat === 'both' && mailOptions.html)) {
					mailOptions.html = `
					${mailOptions.html}
					<br>
					<br>
					---
					<br>
					<em>${attributionText}<a href="${link}" target="_blank">n8n</a></em>
					`;
				} else {
					mailOptions.text = `${mailOptions.text}\n\n---\n${attributionText}n8n\n${'https://n8n.io'}`;
				}
			}

			if (options.attachments && item.binary) {
				const attachments = [];
				const attachmentProperties: string[] = options.attachments
					.split(',')
					.map((propertyName) => {
						return propertyName.trim();
					});

				for (const propertyName of attachmentProperties) {
					const binaryData = this.helpers.assertBinaryData(itemIndex, propertyName);
					attachments.push({
						filename: binaryData.fileName || 'unknown',
						content: await this.helpers.getBinaryDataBuffer(itemIndex, propertyName),
						cid: propertyName,
					});
				}

				if (attachments.length) {
					mailOptions.attachments = attachments;
				}
			}

			const info = await transporter.sendMail(mailOptions);

			returnData.push({
				json: info as unknown as IDataObject,
				pairedItem: {
					item: itemIndex,
				},
			});
		} catch (error) {
			if (this.continueOnFail()) {
				returnData.push({
					json: {
						error: error.message,
					},
					pairedItem: {
						item: itemIndex,
					},
				});
				continue;
			}
			delete error.cert;
			throw new NodeApiError(this.getNode(), error as JsonObject);
		}
	}

	return [returnData];
}
