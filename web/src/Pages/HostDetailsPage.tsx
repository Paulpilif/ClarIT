import { useParams, Link } from "react-router-dom";
import { useHosts } from "../data/hosts";

export default function HostDetailsPage() {
  const { id } = useParams();
  const { hosts, loading, error } = useHosts();
  const host = hosts.find((h) => h.id === id);

  if (loading) {
    return (
      <div style={{ padding: 16 }}>
        <Link to="/hosts">← Retour</Link>
        <p>Chargement de la machine...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 16 }}>
        <Link to="/hosts">← Retour</Link>
        <p>Erreur: {error}</p>
      </div>
    );
  }

  if (!host) {
    return (
      <div style={{ padding: 16 }}>
        <Link to="/hosts">← Retour</Link>
        <p>Machine introuvable</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <Link to="/hosts">← Retour</Link>

      <h1>Détails de la machine</h1>

      <p>
        <strong>IP :</strong> {host.ip}
      </p>
      <p>
        <strong>Hostname :</strong> {host.hostname}
      </p>
      <p>
        <strong>OS :</strong> {host.os ?? "-"}
      </p>
      <p>
        <strong>Dernière détection :</strong>{" "}
        {host.lastSeen ? new Date(host.lastSeen).toLocaleString() : "-"}
      </p>

      <h2>Ports ouverts</h2>
      <ul>
        {(host.ports ?? []).map((port, index) => (
          <li key={index}>
            {port.port}/{port.protocol} — {port.serviceName}{" "}
            {port.status ? `(${port.status})` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
