import { ICredentialType, INodeProperties } from 'n8n-workflow';

export const CREDENTIALS_NAME = 'emailSendMultipleApi';

// eslint-disable-next-line n8n-nodes-base/cred-class-name-unsuffixed
export class EmailSendMultipleCredentials implements ICredentialType {
	name = CREDENTIALS_NAME;
	// eslint-disable-next-line n8n-nodes-base/cred-class-field-display-name-missing-api
	displayName = 'Email Send Multiple';

	properties: INodeProperties[] = [
		{
			displayName: 'Email Send Multiple',
			name: 'emailSendMultiple',
			type: 'string',
			default: '',
			placeholder: 'User=value11;Password=value12;Host=value13;Port=value14;Secure=value15\nUser=value21;Password=value22;Host=value23;Port=value24;Secure=value25',
			hint: 'Use "User=value;Password=value;Host=value;Port=value;Secure=value" format. Separate multiple accounts with a new line.',
			typeOptions: {
				rows: 10,
			},
		},
	];
}

export interface EmailSendMultipleCredentialsData {
	emailSendMultiple: string;
}
