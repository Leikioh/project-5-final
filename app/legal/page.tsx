export default function LegalPage() {
    return (
      <div className="max-w-4xl mx-auto py-20 px-6 text-gray-800">
        <h1 className="text-4xl font-bold mb-6 text-orange-500">Mentions légales</h1>
  
        <p className="mb-4">Ce site est édité par : <strong>Luke Plaut</strong></p>
        <p className="mb-4">Adresse : 123 rue des développeurs, Paris, France</p>
        <p className="mb-4">Contact : contact@recettes-gourmandes.com</p>
        <p className="mb-4">SIRET : 123 456 789 00010</p>
        <p className="mb-4">Hébergeur : MongoDB Atlas + Vercel</p>
  
        <h2 className="text-2xl font-semibold mt-10 mb-4">Protection des données</h2>
        <p className="mb-4">
          Les données personnelles (e-mail, favoris) sont stockées dans une base sécurisée et ne sont
          jamais partagées.
        </p>
  
        <h2 className="text-2xl font-semibold mt-10 mb-4">Cookies</h2>
        <p>
          Ce site utilise uniquement des cookies techniques pour assurer la connexion utilisateur.
        </p>
      </div>
    );
  }
  