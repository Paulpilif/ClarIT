import { Link } from "react-router-dom";
import { mockHosts } from "../mock/hosts";

export default function HostsPage() {
  return (
    <div style={{ padding: 16 }}>
      <h1>Machines détectées</h1>

      <table border={1} cellPadding={10}>
        <thead>
          <tr>
            <th>IP</th>
            <th>Hostname</th>
            <th>OS</th>
            <th>Dernière détection</th>
          </tr>
        </thead>
        <tbody>
          {mockHosts.map((host) => (
            <tr key={host.id}>
              <td>
                <Link to={`/hosts/${host.id}`}>
                  {host.ip}
                </Link>
              </td>
              <td>{host.hostname}</td>
              <td>{host.os}</td>
              <td>{new Date(host.lastSeen).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
