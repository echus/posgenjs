from flask import Flask, request
from flask.ext.cors import CORS

from lxml import etree

WORKFILE = "/var/www/echus.co/public_html/posgenjs/posgen/temp/run.xml"

app = Flask(__name__)
cors = CORS(app)

app.debug = True

@app.route("/points", methods=['POST'])
def points():
    query = request.get_json(force=True)
    lattice = query['lattice']
    x = query['bounds']['x']
    y = query['bounds']['y']
    z = query['bounds']['z']
    spacing = query['spacing']
    mass = {str(k): float(v) for k, v in query['mass'].items()}

    # Generate XML for posgen for this input
    root = etree.Element("posscript")
    version = etree.Element("version")
    version.attrib["value"] = "0.0.1"

    setup = etree.Element(lattice)
    bound = etree.Element("bound")
    bound.attrib["x"] = x
    bound.attrib["y"] = y
    bound.attrib["z"] = z
    setup.append(bound)
    s = etree.Element("spacing")
    A = etree.Element("A")
    A.attrib["value"] = spacing
    s.append(A)
    setup.append(s)
    for i, m in mass.items():
        atom = etree.Element("atom")
        atom.attrib["index"] = "("+str(i)+")"
        atom.attrib["mass"] = str(m)
        setup.append(atom)

    root.append(version)
    root.append(setup)

    # Write to workfile
    xmlstring = etree.tostring(root, pretty_print=True)

    with open(WORKFILE, 'w') as f:
        f.write(xmlstring)

    # Run posgen with XML as input (remember dtd needs to be in same directory)

    # Parse resulting text points and return json array
    return xmlstring
