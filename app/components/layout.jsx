// app/components/Layout.jsx
import { Link } from "@remix-run/react";

export default function Layout({ children }) {
    return (
        <div>
            <header>
                <nav>
                    <Link to="/">Home</Link>
                    <Link to="/products">Products</Link>
                    <Link to="/settings">Settings</Link>
                </nav>
            </header>
            <main>{children}</main>
            <footer>
                <p>© {new Date().getFullYear()} Stock Sync Logic</p>
            </footer>
        </div>
    );
}
