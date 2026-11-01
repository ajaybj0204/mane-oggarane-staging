import type {Metadata} from 'next';import {AppProvider} from '../components/AppProvider';import Header from '../components/Header';import Footer from '../components/Footer';import '@fontsource/plus-jakarta-sans/400.css';import '@fontsource/plus-jakarta-sans/600.css';import '@fontsource/plus-jakarta-sans/700.css';import '@fontsource/plus-jakarta-sans/800.css';
import '@fontsource/playfair-display/600.css';import '@fontsource/playfair-display/700.css';import '@fontsource/playfair-display/600-italic.css';
import '@fontsource/baloo-tamma-2/kannada-600.css';import '@fontsource/baloo-tamma-2/kannada-700.css';import '@fontsource/baloo-tamma-2/kannada-800.css';
import '@fontsource/noto-serif-kannada/kannada-400.css';import '@fontsource/noto-serif-kannada/kannada-700.css';
import './globals.css';import './cafe-redesign.css';import './heritage-theme.css';
export const metadata:Metadata={title:'Mane & Oggarane | ಮನೆಯ ಘಮ, ಪ್ರೀತಿಯ ರುಚಿ',description:'Homestyle Karnataka food, heartfelt rewards, pickup and local delivery.',icons:{icon:[{url:'/mane-oggarane-logo.png?v=3',type:'image/png'}],shortcut:'/mane-oggarane-logo.png?v=3',apple:'/mane-oggarane-logo.png?v=3'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en-IN"><body><AppProvider><Header/>{children}<Footer/></AppProvider></body></html>}
