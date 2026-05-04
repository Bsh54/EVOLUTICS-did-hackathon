import React, { ReactNode } from 'react';
import { DatabaseProvider } from '@nozbe/watermelondb/DatabaseProvider';
import { database } from './index';

interface WatermelonProviderProps {
	children: ReactNode;
}

const WatermelonProvider: React.FC<WatermelonProviderProps> = ({ children }) => {
	return (
		<DatabaseProvider database={database}>
			{children}
		</DatabaseProvider>
	);
};

export default WatermelonProvider;
