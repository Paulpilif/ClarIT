import { Link } from "react-router-dom";
import { useHosts } from "../data/hosts";

export default function HostsPage() {
  const { hosts, loading, error } = useHosts();

  return (
    <div style={{ padding: 16 }}>
      <h1>Machines détectées</h1>

      {loading && <p>Chargement des machines...</p>}
      {error && <p>Erreur: {error}</p>}

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
          {hosts.map((host) => (
            <tr key={host.id}>
              <td>
                <Link to={`/hosts/${host.id}`}>{host.ip}</Link>
              </td>
              <td>{host.hostname}</td>
              <td>{host.os}</td>
              <td>
                {host.lastSeen ? new Date(host.lastSeen).toLocaleString() : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
