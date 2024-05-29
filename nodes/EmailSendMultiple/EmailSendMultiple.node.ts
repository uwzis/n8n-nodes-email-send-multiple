/* eslint-disable n8n-nodes-base/node-filename-against-convention */
import {
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeBaseDescription,
	type INodeTypeDescription,
} from 'n8n-workflow';

import { CREDENTIALS_NAME } from '../../credentials/EmailSendMultipleCredentials.credentials';

import * as send from './send.operation';

const versionDescription: INodeTypeDescription = {
	displayName: 'Send Email Multiple',
	name: 'emailSendMultiple',
	icon: 'fa:envelopes-bulk',
	group: ['output'],
	version: [1],
	description: 'Multiple sends an email using SMTP protocol',
	defaults: {
		name: 'Send Email Multiple',
		color: '#00bb88',
	},
	inputs: ['main'],
	outputs: ['main'],
	credentials: [
		{
			name: CREDENTIALS_NAME,
			required: true,
		},
	],
	properties: [
		{
			displayName: 'Resource',
			name: 'resource',
			type: 'hidden',
			noDataExpression: true,
			default: 'email',
			options: [
				{
					name: 'Email',
					value: 'email',
				},
			],
		},
		{
			displayName: 'Operation',
			name: 'operation',
			type: 'hidden',
			noDataExpression: true,
			default: 'send',
			options: [
				{
					name: 'Send',
					value: 'send',
					action: 'Send an Email',
				},
			],
		},
		...send.description,
	],
};

export class EmailSendMultiple implements INodeType {
	description: INodeTypeDescription;

	constructor(baseDescription: INodeTypeBaseDescription) {
		this.description = {
			...baseDescription,
			...versionDescription,
		};
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		let returnData: INodeExecutionData[][] = [];

		returnData = await send.execute.call(this);

		return returnData;
	}
}
