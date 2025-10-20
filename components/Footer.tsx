'use client'

import { motion } from 'framer-motion'

export default function Footer() {
  const footerLinks = [
    { label: "Lightpaper", href: "#" },
    { label: "Status", href: "#" },
    { label: "Terms", href: "#" },
    { label: "Privacy", href: "#" }
  ]

  return (
    <footer className="py-8 px-6 md:px-8 bg-void-black border-t border-molten-gold/20">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row items-center justify-between"
        >
          <div className="text-gray-400 font-space-grotesk mb-4 md:mb-0">
            © 2025 Prometheus Order
          </div>
          
          <div className="flex flex-wrap gap-6">
            {footerLinks.map((link, index) => (
              <motion.a
                key={link.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                viewport={{ once: true }}
                href={link.href}
                className="text-gray-400 font-space-grotesk hover:text-molten-gold transition duration-300"
              >
                {link.label}
              </motion.a>
            ))}
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
