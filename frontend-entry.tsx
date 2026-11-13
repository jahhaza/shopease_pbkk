import React from 'react';
import { createRoot } from 'react-dom/client';
import ShopEase from './frontend/ShopEase';

const root = document.getElementById('root')!;
createRoot(root).render(<ShopEase demoAccounts={root.dataset.demoAccounts === '1'} initialPage={root.dataset.page ?? 'home'} initialAuth={JSON.parse(root.dataset.auth ?? 'null')}/>);
