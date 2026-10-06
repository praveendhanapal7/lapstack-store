import Doc from '@/components/Doc';
import { BUSINESS as B } from '@/lib/business';
export const metadata = { title: 'Contact us — Lapstack' };
export default function Contact() {
  return (
    <Doc title="Contact us">
      <p className="lead">We usually reply within a few hours.</p>
      <div className="kv">
        <div><span>Business name</span><b>Lapstack is a brand of {B.legalName} (Proprietor: {B.proprietor})</b></div>
        <div><span>Phone / WhatsApp</span><b><a href={`https://wa.me/${B.whatsapp}`}>{B.phone}</a></b></div>
        <div><span>Email</span><b><a href={`mailto:${B.email}`}>{B.email}</a></b></div>
        <div><span>Instagram</span><b>@{B.instagram}</b></div>
        <div><span>Registered office</span><b>{B.address}</b></div>
        <div><span>GSTIN</span><b>{B.gstin}</b></div>
      </div>
    </Doc>
  );
}
