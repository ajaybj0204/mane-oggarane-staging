import type {Metadata} from 'next';import {AppProvider} from '../components/AppProvider';import Header from '../components/Header';import Footer from '../components/Footer';import './globals.css';
export const metadata:Metadata={title:'Mane & Oggarane | ಮನೆಯ ಘಮ, ಪ್ರೀತಿಯ ರುಚಿ',description:'Homestyle Karnataka food, heartfelt rewards, pickup and local delivery.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><AppProvider><Header/>{children}<Footer/></AppProvider></body></html>}
