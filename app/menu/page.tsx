import MenuExperience from '../../components/MenuExperience';import {Suspense} from 'react';
export default function Menu(){return <Suspense fallback={<main className="container section"><h1>Loading our kitchen…</h1></main>}><MenuExperience/></Suspense>}
