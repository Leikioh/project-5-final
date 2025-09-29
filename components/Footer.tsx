export default function Footer() {
  return (
    <footer className="w-full border-t mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-sm text-gray-600 px-6 pt-10 pb-16 text-center md:text-left justify-items-center md:justify-items-start">
        <div>
          <h4 className="font-semibold text-gray-800 mb-2">Presentations</h4>
          <ul>
            <li><a href="#" className="hover:text-orange-500">Software</a></li>
            <li><a href="#" className="hover:text-orange-500">Webinars</a></li>
            <li><a href="#" className="hover:text-orange-500">Workshops</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-gray-800 mb-2">Our Initiatives</h4>
          <ul>
            <li><a href="#" className="hover:text-orange-500">Local Meetups</a></li>
            <li><a href="#" className="hover:text-orange-500">Caring Back</a></li>
            <li><a href="#" className="hover:text-orange-500">Community</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-gray-800 mb-2">Contact</h4>
          <ul>
            <li><a href="#" className="hover:text-orange-500">Work With Us</a></li>
            <li><a href="#" className="hover:text-orange-500">Help</a></li>
            <li><a href="#" className="hover:text-orange-500">Careers</a></li>
            <li><a href="/legal" className="hover:text-orange-500">Mentions légales</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-gray-800 mb-2">Follow us</h4>
          <div className="flex justify-center md:justify-start space-x-4 text-xl">
            <a href="#" aria-label="Facebook">🔵</a>
            <a href="#" aria-label="Instagram">📸</a>
            <a href="#" aria-label="Twitter / X">🐦</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
