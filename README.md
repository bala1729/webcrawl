# webcrawl
1. Install node 8 or above
2. Install the packages
    <br>npm install
3. Run the crawler from a terminal window
    <br>node crawlsearchpage.js parameter1 parameter2
    <br> parameter1 - Replace this with the search term, for example hp+laptops. Note that the search term uses a + to separate the words. Space is not allowed in the search term.
    <br> parameter2- Replace this with the directory where you want to store the output file. The output file crawl_output.csv will be created in this directory under a folder named with the search term.
    
    <br>Example usage: node crawlsearchpage.js hp+laptops /Users/workspace/crawloutput
    
    <br> In the above example the output file crawloutput.csv will be found in the folder named hp+laptops found under /Users/workspace/crawloutput directory.
