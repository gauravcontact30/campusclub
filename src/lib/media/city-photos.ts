import type { CityPhoto } from '@/types';

/**
 * One real photograph of one real place, per city.
 *
 * Sourced from the lead image of the city's own Wikipedia article — or, where
 * that article had no usable photograph, from a named landmark inside the same
 * district. `article` records which, so a bad choice can be argued with, and
 * `artist` and `licence` are not decoration: every one of these licences
 * requires the credit the card prints.
 *
 * The files are ours, under `public/cities`, rather than hotlinks to
 * Wikimedia. That is not only politeness — Wikimedia rate-limits automated
 * fetchers hard enough that the image optimiser was getting 429s on a page of
 * six cards, and they ask people not to hotlink at scale in the first place.
 * Each one is centre-cropped to the 16:10 the card draws and re-encoded, so
 * nothing is shipped to be thrown away.
 *
 * `source` is the provenance: the exact Wikimedia thumbnail each file came
 * from. Re-fetching is a matter of walking that field, and re-cropping is a
 * matter of re-running the same pass. Note that Wikimedia rejects direct
 * requests for thumbnail widths outside its standard set — 20, 40, 60, 120,
 * 250, 330, 500, 960, 1280, 1920, 3840 — so 960 in these URLs may be swapped
 * for another standard size but not for an arbitrary one.
 *
 * Adding a city is a command, not an afternoon of right-clicking:
 *
 *   node scripts/city-photos.mjs <slug>:<Wikipedia article>
 *
 * which downloads, crops and credits one, and prints the entry to paste in
 * below. Entries are pasted rather than written back on purpose — this map is
 * source that gets read and argued with, and a script that rewrote it would
 * make a bad choice of article invisible.
 *
 * Prove every file is still on disk with:
 *
 *   npm run media:check
 */
export const CITY_PHOTOS: Record<string, CityPhoto> = {
  delhi: {
    src: "/cities/delhi.jpg",
    article: "Delhi",
    artist: "Marcin Białek",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Jama_Masjid_2011.jpg/960px-Jama_Masjid_2011.jpg",
  },
  mumbai: {
    src: "/cities/mumbai.jpg",
    article: "Mumbai",
    artist: "Rutiknatekar",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Mumbai_Bandra-Worli_Sea_Link.jpg/960px-Mumbai_Bandra-Worli_Sea_Link.jpg",
  },
  kolkata: {
    src: "/cities/kolkata.jpg",
    article: "Kolkata",
    artist: "NalGup20",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Kolkata_maidan.jpg/960px-Kolkata_maidan.jpg",
  },
  chennai: {
    src: "/cities/chennai.jpg",
    article: "Chennai",
    artist: "jamal haider from india",
    licence: "CC BY-SA 2.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/2.0",
    source: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Chennai_Central.jpg/960px-Chennai_Central.jpg",
  },
  bengaluru: {
    src: "/cities/bengaluru.jpg",
    article: "Bengaluru",
    artist: "Gpkp",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/View_from_Visvesvaraya_Industrial_and_Technological_Museum_%282025%29_02.jpg/960px-View_from_Visvesvaraya_Industrial_and_Technological_Museum_%282025%29_02.jpg",
  },
  hyderabad: {
    src: "/cities/hyderabad.jpg",
    article: "Hyderabad",
    artist: "iMahesh",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Aerial_view_of_Durgam_cheruvu_and_Hitech_CIty.jpg/960px-Aerial_view_of_Durgam_cheruvu_and_Hitech_CIty.jpg",
  },
  pune: {
    src: "/cities/pune.jpg",
    article: "Pune",
    artist: "Ujjawal.Gayakwad",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Pune_West_skyline_-_March_2017.jpg/960px-Pune_West_skyline_-_March_2017.jpg",
  },
  ahmedabad: {
    src: "/cities/ahmedabad.jpg",
    article: "Ahmedabad",
    artist: "Tarun802",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Sabarmati_riverside.jpg/960px-Sabarmati_riverside.jpg",
  },
  jaipur: {
    src: "/cities/jaipur.jpg",
    article: "Hawa Mahal",
    artist: "Chainwit.",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/East_facade_Hawa_Mahal_Jaipur_from_ground_level_%28July_2022%29_-_img_01.jpg/960px-East_facade_Hawa_Mahal_Jaipur_from_ground_level_%28July_2022%29_-_img_01.jpg",
  },
  lucknow: {
    src: "/cities/lucknow.jpg",
    article: "Rumi Darwaza",
    artist: "Rishabhgpt",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Rumi_Darwaza_-_DSC2797-01.jpg/960px-Rumi_Darwaza_-_DSC2797-01.jpg",
  },
  kanpur: {
    src: "/cities/kanpur.jpg",
    article: "Kanpur Memorial Church",
    artist: "Shivam Maini",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Kanpur_Memorial_Church.jpg/960px-Kanpur_Memorial_Church.jpg",
  },
  varanasi: {
    src: "/cities/varanasi.jpg",
    article: "Dashashwamedh Ghat",
    artist: "Saaremees",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Dasaswamedh_ghat-varanasi_india-andres_larin.jpg/960px-Dasaswamedh_ghat-varanasi_india-andres_larin.jpg",
  },
  agra: {
    src: "/cities/agra.jpg",
    article: "Taj Mahal",
    artist: "Yann; edited by Jim Carter",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Taj_Mahal_%28Edited%29.jpeg/960px-Taj_Mahal_%28Edited%29.jpeg",
  },
  nagpur: {
    src: "/cities/nagpur.jpg",
    article: "Deekshabhoomi",
    artist: "Nikkul",
    licence: "CC BY 3.0",
    licenceUrl: "https://creativecommons.org/licenses/by/3.0",
    source: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Dheekshabhoomi_in_Nagpur.jpg/960px-Dheekshabhoomi_in_Nagpur.jpg",
  },
  nashik: {
    src: "/cities/nashik.jpg",
    article: "Kalaram Temple",
    artist: "Pradeep717",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Kalaram_Temple_Nashik_Corner_View.jpg/960px-Kalaram_Temple_Nashik_Corner_View.jpg",
  },
  indore: {
    src: "/cities/indore.jpg",
    article: "Rajwada",
    artist: "DeepakNigam",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Indore_Rajwada01.jpg/960px-Indore_Rajwada01.jpg",
  },
  bhopal: {
    src: "/cities/bhopal.jpg",
    article: "Taj-ul-Masajid",
    artist: "Yann",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Taj-ul-Masjid%2C_Bhopal%2C_India.jpg/960px-Taj-ul-Masjid%2C_Bhopal%2C_India.jpg",
  },
  patna: {
    src: "/cities/patna.jpg",
    article: "Golghar",
    artist: "कवि कलाकार हिमांशु मान्ने (Poet artist himanshu manne)",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Golghar_%E0%A5%AA.jpg/960px-Golghar_%E0%A5%AA.jpg",
  },
  surat: {
    src: "/cities/surat.jpg",
    article: "Surat",
    artist: "Rahul Bhadane",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Bharthana_Althan_area.jpg/960px-Bharthana_Althan_area.jpg",
  },
  vadodara: {
    src: "/cities/vadodara.jpg",
    article: "Lakshmi Vilas Palace, Vadodara",
    artist: "Birsa Murmu",
    licence: "CC BY-SA 3.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    source: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Lakshmi_Vilas_Palace%2C_Vadodara.jpg/960px-Lakshmi_Vilas_Palace%2C_Vadodara.jpg",
  },
  coimbatore: {
    src: "/cities/coimbatore.jpg",
    article: "Coimbatore",
    artist: "Ramprasad014",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/CHIL_SEZ.jpg/960px-CHIL_SEZ.jpg",
  },
  madurai: {
    src: "/cities/madurai.jpg",
    article: "Meenakshi Temple",
    artist: "எஸ்ஸார்",
    licence: "CC BY 3.0",
    licenceUrl: "https://creativecommons.org/licenses/by/3.0",
    source: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/An_aerial_view_of_Madurai_city_from_atop_of_Meenakshi_Amman_temple.jpg/960px-An_aerial_view_of_Madurai_city_from_atop_of_Meenakshi_Amman_temple.jpg",
  },
  kochi: {
    src: "/cities/kochi.jpg",
    article: "Fort Kochi",
    artist: "Vyacheslav Argenberg",
    licence: "CC BY 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by/4.0",
    source: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Kochi%2C_Fishing_nets_at_sunset%2C_Kerala%2C_India.jpg/960px-Kochi%2C_Fishing_nets_at_sunset%2C_Kerala%2C_India.jpg",
  },
  thiruvananthapuram: {
    src: "/cities/thiruvananthapuram.jpg",
    article: "Padmanabhaswamy Temple",
    artist: "Rahulrnath001",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Sree_Padmanabhaswamy_temple_01.jpg/960px-Sree_Padmanabhaswamy_temple_01.jpg",
  },
  visakhapatnam: {
    src: "/cities/visakhapatnam.jpg",
    article: "Kailasagiri",
    artist: "kmdangi",
    licence: "CC BY-SA 3.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    source: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Kailasagiri.jpg/960px-Kailasagiri.jpg",
  },
  vijayawada: {
    src: "/cities/vijayawada.jpg",
    article: "Prakasam Barrage",
    artist: "IM3847",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Prakasam_Barrage_from_Vijayawada_to_Guntur_2_%28November_2018%29.jpg/960px-Prakasam_Barrage_from_Vijayawada_to_Guntur_2_%28November_2018%29.jpg",
  },
  mysuru: {
    src: "/cities/mysuru.jpg",
    article: "Mysore Palace",
    artist: "Muhammad Mahdi Karim",
    licence: "GFDL 1.2",
    licenceUrl: "http://www.gnu.org/licenses/old-licenses/fdl-1.2.html",
    source: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Mysore_Palace_Morning.jpg/960px-Mysore_Palace_Morning.jpg",
  },
  chandigarh: {
    src: "/cities/chandigarh.jpg",
    article: "Rock Garden of Chandigarh",
    artist: "Ijon",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Chandigarh_Rock_Garden_4.jpg/960px-Chandigarh_Rock_Garden_4.jpg",
  },
  ludhiana: {
    src: "/cities/ludhiana.jpg",
    article: "Ludhiana",
    artist: "Teerserv",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Omaxe_Twin_Tower_%281%29.jpg/960px-Omaxe_Twin_Tower_%281%29.jpg",
  },
  amritsar: {
    src: "/cities/amritsar.jpg",
    article: "Golden Temple",
    artist: "Shagil Kannur",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/The_Golden_Temple_of_Amrithsar_7.jpg/960px-The_Golden_Temple_of_Amrithsar_7.jpg",
  },
  bhubaneswar: {
    src: "/cities/bhubaneswar.jpg",
    article: "Lingaraja Temple",
    artist: "Satyakam Parthasarathy",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Lingaraj_Temple_%2C_Bhubaneswar.jpg/960px-Lingaraj_Temple_%2C_Bhubaneswar.jpg",
  },
  guwahati: {
    src: "/cities/guwahati.jpg",
    article: "Kamakhya Temple",
    artist: "Devkmaravi",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Kamakhya_Temple_-_DEV_8829.jpg/960px-Kamakhya_Temple_-_DEV_8829.jpg",
  },
  dehradun: {
    src: "/cities/dehradun.jpg",
    article: "Forest Research Institute (India)",
    artist: "Torarne",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Forest_Research_Institute_campus%2C_Dehradun%2C_India.jpg/960px-Forest_Research_Institute_campus%2C_Dehradun%2C_India.jpg",
  },
  raipur: {
    src: "/cities/raipur.jpg",
    article: "Raipur",
    artist: "Indulal Patel",
    licence: "CC BY-SA 3.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    source: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Sri_Ram_Mandir_raipur_.jpg/960px-Sri_Ram_Mandir_raipur_.jpg",
  },
  ranchi: {
    src: "/cities/ranchi.jpg",
    article: "Jagannath Temple, Ranchi",
    artist: "Ms Sarah Welch",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/17th_century_Jagannath_temple_Ranchi_Jharkhand_-_9.jpg/960px-17th_century_Jagannath_temple_Ranchi_Jharkhand_-_9.jpg",
  },
  jodhpur: {
    src: "/cities/jodhpur.jpg",
    article: "Mehrangarh",
    artist: "Sanhitasinha",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Mehrangarh_Fort_sanhita.jpg/960px-Mehrangarh_Fort_sanhita.jpg",
  },
  mainpuri: {
    src: "/cities/mainpuri.jpg",
    article: "Mainpuri district",
    artist: "Gyanendra_Singh_Chau…",
    licence: "CC BY 3.0",
    licenceUrl: "https://creativecommons.org/licenses/by/3.0",
    source: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Rameshwer_Dham_Shiv_Mandir_Dilaha_-_panoramio_%285%29.jpg/960px-Rameshwer_Dham_Shiv_Mandir_Dilaha_-_panoramio_%285%29.jpg",
  },
  etawah: {
    src: "/cities/etawah.jpg",
    article: "Etawah",
    artist: "Coolboy gaurav397",
    licence: "CC BY-SA 3.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    source: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/VVIP_Guest_House_%28Sumer_SIngh_Fort%29.jpg/960px-VVIP_Guest_House_%28Sumer_SIngh_Fort%29.jpg",
  },
};

/** The photograph for a city, if we have one. */
export function cityPhoto(slug: string): CityPhoto | null {
  return CITY_PHOTOS[slug] ?? null;
}
