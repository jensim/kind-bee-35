
export interface LinkProps {
    children: string;
    href: string;
}
export function Link(props:LinkProps) {
    return <span className={"px-2 py-1 border-gray-500 border-2 rounded bg-white hover:bg-gray-200 transition-colors"}><a href={props.href}>{props.children}</a></span>;
}
