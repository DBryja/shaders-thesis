import { IUniform } from 'three';

export interface IUniforms {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[uniform: string]: IUniform<any>;
}
