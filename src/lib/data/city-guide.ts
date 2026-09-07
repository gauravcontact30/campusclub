import type { CityGuide } from '@/types';

/**
 * What each city is known for, keyed by slug.
 *
 * Held apart from `CITIES` in `lib/constants` on purpose: that list is
 * structural — slug, state, coordinates, the things routing and search depend
 * on — and this is editorial, the part that grows a paragraph at a time as
 * somebody who knows a town writes it up.
 *
 * Two rules, and they are the whole reason `CityGuide` has no required fields:
 *
 * 1. Every entry names something that exists. A restaurant, a hotel, a
 *    stadium — real ones, the kind somebody could walk to and find.
 * 2. A city we cannot write truthfully about gets fewer lines, or none. The
 *    card draws only the sections it has and says plainly when a town has not
 *    been written up. That is a gap somebody can close; an invented dinner
 *    recommendation is a gap nobody can even see.
 *
 * Coverage is uneven and openly so. The metros and the Tier-2 cities are
 * written up in full; a handful of the Tier-2 entries are short a section
 * rather than carrying a guess — Agra and Nashik have no `play` line because
 * naming a ground there means naming one somebody could turn up to and find,
 * and that has not been checked. Mainpuri and Etawah carry landmarks alone for
 * the same reason. Filling any of those in is ordinary editorial work, not a
 * code change.
 */
export const CITY_GUIDE: Record<string, CityGuide> = {
  delhi: {
    places: ['Red Fort', 'Humayun’s Tomb', 'Qutub Minar', 'Lodhi Garden', 'Chandni Chowk'],
    eat: ['Karim’s by the Jama Masjid', 'Paranthe Wali Gali', 'Al Jawahar', 'Saravana Bhavan in Connaught Place'],
    stay: ['The Imperial on Janpath', 'The Lodhi', 'Bloomrooms for the cheap version'],
    play: ['Jawaharlal Nehru Stadium', 'Arun Jaitley Stadium at Feroz Shah Kotla', 'Thyagaraj Sports Complex', 'Siri Fort Sports Complex'],
  },
  mumbai: {
    places: ['Gateway of India', 'Marine Drive', 'Elephanta Caves', 'Sanjay Gandhi National Park'],
    eat: ['Britannia & Co. in Ballard Estate', 'Bademiya behind the Taj', 'Cafe Madras in Matunga', 'Mohammed Ali Road in Ramzan'],
    stay: ['The Taj Mahal Palace, Colaba', 'The Oberoi, Nariman Point', 'Abode Bombay'],
    play: ['Wankhede Stadium', 'Brabourne Stadium', 'Andheri Sports Complex', 'Shivaji Park'],
  },
  kolkata: {
    places: ['Victoria Memorial', 'Howrah Bridge', 'Dakshineswar Kali temple', 'College Street and the Coffee House'],
    eat: ['Peter Cat for chelo kebab', 'Arsalan for biryani', 'Flurys on Park Street', 'Kachori at Putiram'],
    stay: ['The Oberoi Grand', 'ITC Royal Bengal', 'Sudder Street guesthouses'],
    play: ['Eden Gardens', 'Vivekananda Yuba Bharati Krirangan at Salt Lake', 'The Maidan club grounds'],
  },
  chennai: {
    places: ['Marina Beach', 'Kapaleeshwarar temple, Mylapore', 'Fort St. George', 'Mahabalipuram down the ECR'],
    eat: ['Murugan Idli Shop', 'Ratna Cafe for sambar', 'Buhari for biryani', 'Sangeetha for tiffin'],
    stay: ['Taj Coromandel', 'The Park Chennai', 'Hostels around Besant Nagar'],
    play: ['M. A. Chidambaram Stadium at Chepauk', 'Jawaharlal Nehru Stadium', 'Velachery Aquatic Complex'],
  },
  bengaluru: {
    places: ['Lalbagh Botanical Garden', 'Cubbon Park', 'Bangalore Palace', 'Nandi Hills for the sunrise ride'],
    eat: ['MTR on Lalbagh Road', 'CTR in Malleshwaram', 'Koshy’s on St Marks Road', 'VV Puram food street'],
    stay: ['The Leela Palace, Old Airport Road', 'Taj West End', 'ITC Gardenia'],
    play: ['Sree Kanteerava Stadium', 'M. Chinnaswamy Stadium', 'Kanteerava indoor and aquatic complex'],
  },
  hyderabad: {
    places: ['Charminar', 'Golconda Fort', 'Chowmahalla Palace', 'Hussain Sagar', 'Ramoji Film City'],
    eat: ['Paradise and Bawarchi for biryani', 'Nimrah Cafe by the Charminar', 'Chutneys for tiffin'],
    stay: ['Taj Falaknuma Palace', 'ITC Kohenur', 'Park Hyatt Hyderabad'],
    play: ['Rajiv Gandhi International Stadium at Uppal', 'Gachibowli Athletic Stadium', 'GMC Balayogi Stadium'],
  },
  pune: {
    places: ['Shaniwar Wada', 'Aga Khan Palace', 'Sinhagad Fort', 'Dagdusheth Halwai temple'],
    eat: ['Vaishali on FC Road', 'Goodluck Cafe', 'Kayani Bakery for Shrewsbury biscuits', 'German Bakery, Koregaon Park'],
    stay: ['JW Marriott Pune', 'Conrad Pune', 'Hotel Shreyas for the old-city version'],
    play: ['MCA Stadium at Gahunje', 'Shri Shiv Chhatrapati Sports Complex, Balewadi', 'Deccan Gymkhana'],
  },
  ahmedabad: {
    places: ['Sabarmati Ashram', 'Adalaj Stepwell', 'Sidi Saiyyed Mosque', 'Kankaria Lake', 'The old-city pols'],
    eat: ['Agashiye at House of MG', 'Manek Chowk after dark', 'Das Khaman', 'Gopi Dining Hall'],
    stay: ['House of MG', 'Hyatt Regency Ahmedabad'],
    play: ['Narendra Modi Stadium at Motera', 'TransStadia', 'The Sardar Patel grounds'],
  },
  jaipur: {
    places: ['Hawa Mahal', 'Amber Fort', 'City Palace', 'Jantar Mantar', 'Nahargarh for the sunrise'],
    eat: ['Rawat Mishthan Bhandar for pyaaz kachori', 'LMB in Johari Bazaar', 'Handi on MI Road', 'Masala Chowk in Ram Niwas Garden'],
    stay: ['Rambagh Palace', 'Jai Mahal Palace', 'The hostels clustered in Bani Park'],
    play: ['Sawai Mansingh Stadium', 'SMS Indoor Stadium', 'Chaugan Stadium in the old city'],
  },
  jodhpur: {
    places: ['Mehrangarh', 'Umaid Bhawan Palace', 'Jaswant Thada', 'Toorji ka Jhalra stepwell', 'The Clock Tower market'],
    eat: ['Janta Sweet Home', 'Shri Mishrilal Hotel for makhaniya lassi', 'Gypsy for the thali', 'The omelette stalls at Sardar Market'],
    stay: ['Umaid Bhawan Palace', 'RAAS Jodhpur', 'The guesthouses under the fort in Navchokiya'],
    play: ['Barkatullah Khan Stadium'],
  },
  lucknow: {
    places: ['Bara Imambara', 'Rumi Darwaza', 'Chota Imambara', 'The Residency', 'Ambedkar Memorial Park'],
    eat: ['Tunday Kababi in Aminabad', 'Idris ki Biryani in Chowk', 'Royal Cafe for basket chaat', 'The chai stalls of Hazratganj'],
    stay: ['Taj Mahal Lucknow', 'Hyatt Regency Lucknow', 'Lebua Lucknow'],
    play: ['Ekana Cricket Stadium', 'K. D. Singh Babu Stadium', 'The Dhyan Chand astroturf'],
  },
  kanpur: {
    places: ['JK Temple', 'Kanpur Memorial Church', 'Allen Forest Zoo', 'Bithoor on the Ganga'],
    eat: ['Thaggu ke Laddu', 'Baba Biryani in Chunniganj', 'Chappan Bhog for sweets'],
    stay: ['The Landmark Towers on Mall Road', 'Ramada Kanpur'],
    play: ['Green Park Stadium', 'The IIT Kanpur grounds'],
  },
  varanasi: {
    places: ['Dashashwamedh Ghat', 'Kashi Vishwanath temple', 'Assi Ghat', 'Sarnath', 'Manikarnika Ghat'],
    eat: ['Kachori Gali off Vishwanath Gali', 'Blue Lassi in Kachori Gali', 'Deena Chaat Bhandar', 'Baati chokha in Lanka'],
    stay: ['Brijrama Palace at Darbhanga Ghat', 'Taj Ganges', 'The guesthouses around Assi'],
    play: ['Dr. Sampurnanand Sports Stadium at Sigra', 'The BHU sports complex'],
  },
  agra: {
    places: ['Taj Mahal', 'Agra Fort', 'Fatehpur Sikri', 'Itmad-ud-Daulah', 'Mehtab Bagh for the far bank'],
    eat: ['Panchhi Petha', 'Mama Chicken in Sadar Bazaar', 'Bedai and jalebi at Deviram'],
    stay: ['The Oberoi Amarvilas', 'ITC Mughal', 'The homestays in Taj Ganj'],
  },
  nagpur: {
    places: ['Deekshabhoomi', 'Zero Mile Stone', 'Ambazari Lake', 'Futala Lake', 'Sitabuldi Fort'],
    eat: ['Saoji thali in Itwari', 'The tarri poha carts across Sitabuldi', 'Orange barfi, in season'],
    stay: ['Radisson Blu Nagpur', 'Le Meridien Nagpur', 'Centre Point Hotel'],
    play: ['VCA Stadium at Jamtha', 'The VCA ground at Civil Lines', 'Mankapur Divisional Sports Complex'],
  },
  nashik: {
    places: ['Trimbakeshwar temple', 'Panchavati and Ramkund', 'Sula Vineyards', 'Pandavleni Caves', 'Anjneri hill'],
    eat: ['Sadhana Misal', 'Ambika Misal in Panchavati', 'The chivda shops of Old Nashik'],
    stay: ['Beyond by Sula', 'Express Inn Nashik', 'The Gateway Hotel at Ambad'],
  },
  indore: {
    places: ['Rajwada', 'Lal Bagh Palace', 'Kanch Mandir', 'Sarafa Bazaar after dark', 'Patalpani falls'],
    eat: ['Sarafa Bazaar from ten at night', 'Chhappan Dukan', 'Johny Hot Dog at 56', 'Vijay Chaat House'],
    stay: ['Sayaji Indore', 'Radisson Blu Indore', 'Indore Marriott'],
    play: ['Holkar Cricket Stadium', 'Nehru Stadium', 'Abhay Prashal indoor complex'],
  },
  bhopal: {
    places: ['Taj-ul-Masajid', 'The Upper Lake', 'Van Vihar', 'Bharat Bhavan', 'Sanchi, an hour out'],
    eat: ['Chatori Gali in Ibrahimpura', 'Manohar Dairy', 'Bapu ki Kutia', 'Indian Coffee House on New Market'],
    stay: ['Jehan Numa Palace', 'Noor-Us-Sabah Palace', 'Courtyard by Marriott Bhopal'],
    play: ['TT Nagar Stadium', 'Aishbagh Stadium', 'The Prakash Tarun Pushkar pool'],
  },
  patna: {
    places: ['Golghar', 'Takht Sri Patna Sahib', 'Patna Museum', 'Gandhi Maidan', 'Mahavir Mandir'],
    eat: ['The litti chokha stalls around Gandhi Maidan', 'The sweet shops along Boring Road', 'Khaja brought in from Silao'],
    stay: ['Hotel Maurya Patna', 'Lemon Tree Premier Patna', 'Hotel Chanakya'],
    play: ['Moin-ul-Haq Stadium', 'Patliputra Sports Complex'],
  },
  surat: {
    places: ['Dutch Garden', 'Surat Castle', 'Dumas Beach', 'Gopi Talav', 'Sardar Patel Museum'],
    eat: ['Surti locho along Ghod Dod Road', 'Ghari in the weeks around Chandi Padvo', 'Undhiyu stalls, all winter'],
    stay: ['Surat Marriott', 'The Gateway Hotel at Athwalines', 'Lords Plaza Surat'],
    play: ['Lalbhai Contractor Stadium', 'Pandit Dindayal Upadhyay Indoor Stadium'],
  },
  vadodara: {
    places: ['Lakshmi Vilas Palace', 'Sayaji Baug', 'Kirti Mandir', 'EME Temple', 'Champaner, an hour out'],
    eat: ['Mahakali Sev Usal', 'Jagdish Farsan', 'Duliram Kakawala for chocolate barfi'],
    stay: ['Welcomhotel Vadodara', 'Vivanta Vadodara', 'Grand Mercure Vadodara'],
    play: ['Kotambi Stadium', 'Reliance Stadium at Moti Bagh', 'The MSU sports grounds'],
  },
  coimbatore: {
    places: ['Marudhamalai temple', 'Perur Pateeswarar temple', 'The Adiyogi statue at Isha', 'VOC Park', 'Siruvani falls'],
    eat: ['Annapoorna Gowrishankar for tiffin', 'Hotel Junior Kuppanna', 'Anandhaas', 'Aiswarya Bhavan'],
    stay: ['Vivanta Coimbatore', 'Le Meridien Coimbatore', 'The Residency'],
    play: ['Nehru Stadium', 'The VOC Grounds', 'CODISSIA indoor courts'],
  },
  madurai: {
    places: ['Meenakshi Amman temple', 'Thirumalai Nayakkar Mahal', 'Gandhi Memorial Museum', 'Alagar Kovil'],
    eat: ['Murugan Idli Shop', 'Konar Mess for kari dosai', 'Amma Mess', 'Famous Jigarthanda on West Masi Street'],
    stay: ['Heritage Madurai', 'The Gateway Hotel at Pasumalai', 'Poppys Hotel'],
    play: ['Race Course Stadium', 'Tamukkam Grounds'],
  },
  kochi: {
    places: ['Fort Kochi and the Chinese fishing nets', 'Mattancherry Palace', 'Jew Town', 'Marine Drive', 'Cherai Beach'],
    eat: ['Kayees Rahmathulla for biryani', 'Dhe Puttu', 'Kashi Art Cafe in Fort Kochi', 'The toddy shops out on the Vypin road'],
    stay: ['Brunton Boatyard', 'Taj Malabar on Willingdon Island', 'The homestays across Fort Kochi'],
    play: ['Jawaharlal Nehru Stadium at Kaloor', 'Regional Sports Centre', 'The Maharaja’s College ground'],
  },
  thiruvananthapuram: {
    places: ['Padmanabhaswamy temple', 'Kovalam', 'Shanghumugham beach', 'Napier Museum', 'Poovar backwaters'],
    eat: ['Indian Coffee House on the Maveli spiral', 'Ariya Nivaas for sadhya', 'Azad Restaurant for biryani'],
    stay: ['The Leela Kovalam', 'Vivanta Trivandrum', 'Hycinth by Sparsa'],
    play: ['Greenfield Stadium at Karyavattom', 'Chandrasekharan Nair Stadium', 'University Stadium'],
  },
  visakhapatnam: {
    places: ['RK Beach', 'Kailasagiri', 'The INS Kursura submarine museum', 'Simhachalam temple', 'Araku Valley'],
    eat: ['Dharani for an Andhra meal', 'Sri Kanya for tiffin', 'The fish-fry stalls along Beach Road'],
    stay: ['Novotel Varun Beach', 'The Park Visakhapatnam', 'The Gateway Hotel on Beach Road'],
    play: ['ACA-VDCA Stadium', 'Indira Priyadarshini Stadium', 'The Port Trust pool complex'],
  },
  vijayawada: {
    places: ['Kanaka Durga temple on Indrakeeladri', 'Prakasam Barrage', 'Undavalli Caves', 'Bhavani Island'],
    eat: ['Babai Hotel for tiffin', 'The Andhra meals along MG Road', 'Guntur-hot everything, be warned'],
    stay: ['Novotel Vijayawada Varun', 'The Gateway Hotel on MG Road', 'Fortune Murali Park'],
    play: ['Indira Gandhi Municipal Stadium', 'The ACA ground at Mulapadu'],
  },
  mysuru: {
    places: ['Mysore Palace', 'Chamundi Hills', 'Brindavan Gardens', 'St Philomena’s Church', 'Devaraja Market'],
    eat: ['Vinayaka Mylari for the dosa', 'Hotel RRR', 'Guru Sweet Mart for Mysore pak'],
    stay: ['Lalitha Mahal Palace', 'Radisson Blu Plaza Mysore', 'Hotel Metropole'],
    play: ['Chamundi Vihar Stadium', 'Mysore Race Course', 'The Manasagangotri sports pavilion'],
  },
  chandigarh: {
    places: ['The Rock Garden', 'Sukhna Lake', 'The Capitol Complex', 'Rose Garden', 'Elante for the indoor version'],
    eat: ['Pal Dhaba in Sector 28', 'Sindhi Sweets', 'Gopal’s in Sector 8', 'Backpackers Cafe in Sector 9'],
    stay: ['Taj Chandigarh', 'Hyatt Regency Chandigarh', 'JW Marriott Chandigarh'],
    play: ['Sector 16 Stadium', 'The Sector 42 cricket stadium', 'Lake Sports Complex'],
  },
  ludhiana: {
    places: ['Nehru Rose Garden', 'The PAU museum', 'Lodhi Fort', 'Tiger Safari on the Ferozepur road'],
    eat: ['The kulcha stalls around Ghumar Mandi', 'The sweet shops of Chaura Bazaar'],
    stay: ['Hyatt Regency Ludhiana', 'Radisson Blu Ludhiana', 'Park Plaza Ludhiana'],
    play: ['Guru Nanak Stadium', 'The PAU grounds'],
  },
  amritsar: {
    places: ['The Golden Temple', 'Jallianwala Bagh', 'Partition Museum', 'Gobindgarh Fort', 'The Wagah ceremony'],
    eat: ['Kesar da Dhaba', 'Bharawan da Dhaba', 'Makhan Fish', 'Gurdas Ram Jalebi Wala', 'Langar, at any hour'],
    stay: ['Taj Swarna', 'Hyatt Amritsar', 'The guesthouses off Heritage Street'],
    play: ['Gandhi Stadium', 'The Guru Nanak Dev University grounds'],
  },
  bhubaneswar: {
    places: ['Lingaraja temple', 'Udayagiri and Khandagiri caves', 'Mukteshwar temple', 'Dhauli', 'Nandankanan'],
    eat: ['Dalma in Saheed Nagar', 'Odisha Hotel', 'The chaat carts at Ram Mandir square'],
    stay: ['Mayfair Lagoon', 'Trident Bhubaneswar', 'Swosti Premium'],
    play: ['Kalinga Stadium', 'The KIIT sports complex'],
  },
  guwahati: {
    places: ['Kamakhya temple', 'Umananda island', 'The Brahmaputra riverfront', 'Assam State Zoo', 'Pobitora, an hour out'],
    eat: ['Paradise for an Assamese thali', 'Khorikaa for smoked meats', 'The fish thalis of Fancy Bazar'],
    stay: ['Radisson Blu Guwahati', 'Vivanta Guwahati', 'Novotel Guwahati'],
    play: ['Barsapara Cricket Stadium', 'Indira Gandhi Athletic Stadium at Sarusajai', 'Nehru Stadium'],
  },
  dehradun: {
    places: ['Forest Research Institute', 'Robber’s Cave', 'Mindrolling Monastery', 'Tapkeshwar temple', 'Mussoorie, an hour up'],
    eat: ['Kumar Sweet Shop on Rajpur Road', 'Ellora’s Bakery', 'The chaat lanes of Paltan Bazaar'],
    stay: ['Hyatt Centric Dehradun', 'Lemon Tree Dehradun', 'Hotel Madhuban'],
    play: ['Rajiv Gandhi International Cricket Stadium', 'The Maharana Pratap Sports College grounds'],
  },
  raipur: {
    places: ['Mahant Ghasidas Museum', 'Vivekananda Sarovar', 'Purkhauti Muktangan', 'Nandan Van', 'Sirpur, an hour out'],
    eat: ['Gadh Kaleva for a Chhattisgarhi thali', 'The chaat around Sharda Chowk'],
    stay: ['Courtyard by Marriott Raipur', 'Hyatt Raipur', 'Babylon International'],
    play: ['Shaheed Veer Narayan Singh Stadium at Naya Raipur', 'The Budhapara sports complex'],
  },
  ranchi: {
    places: ['Jagannath temple', 'Pahari Mandir', 'Hundru Falls', 'Dassam Falls', 'Rock Garden by Kanke Dam'],
    eat: ['The litti chokha stalls around Firayalal', 'Kaveri for the thali', 'The momo carts of Lalpur'],
    stay: ['Radisson Blu Ranchi', 'Le Lac Sarovar Portico', 'Chanakya BNR Hotel'],
    play: ['JSCA International Stadium', 'Birsa Munda Football Stadium', 'Mecon Stadium'],
  },
  mainpuri: {
    places: ['Sheetala Devi temple', 'Kurra Jafarabad', 'Bhawan Devi temple'],
  },
  etawah: {
    places: ['Etawah Lion Safari Park', 'Kali Vahan temple', 'The Chambal ravines'],
  },
};

/** The guide for a city, or an empty one — the card draws only what it has. */
export function cityGuide(slug: string): CityGuide {
  return CITY_GUIDE[slug] ?? {};
}

/** Whether anything at all has been written about this city yet. */
export function hasGuide(slug: string): boolean {
  const guide = CITY_GUIDE[slug];
  return Boolean(guide && Object.values(guide).some((list) => list?.length));
}
