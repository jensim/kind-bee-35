import {Link} from "../components/Link.tsx";
import { useState } from 'preact/hooks';

export default function SteamName() {
    const [name, setName] = useState('');
    return (
        <div className="flex gap-8 py-6">
            <input className={'border: 2px solid black; border-radius: 4px;'} value={name} onChange={(evt) => setName(evt.target.value)}/>
            <Link href={'/steam/'+name}>Load</Link>
        </div>
    );
}
